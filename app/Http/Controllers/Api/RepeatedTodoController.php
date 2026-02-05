<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RepeatedTodo;
use App\Models\RepeatedTodoWeekSnapshot;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\UniqueConstraintViolationException;

class RepeatedTodoController extends Controller
{
    private function weekStart(Carbon $date): Carbon
    {
        return $date->copy()->startOfWeek(Carbon::MONDAY);
    }

    /**
     * Get or create week snapshot. Uses date(week_start) for lookup so SQLite
     * matches both 'Y-m-d' and 'Y-m-d H:i:s' stored values; creates only when
     * missing and catches duplicate insert (race) by re-fetching.
     */
    private function ensureSnapshotForWeek(int $repeatedTodoId, string $weekStartString): RepeatedTodoWeekSnapshot
    {
        $snap = RepeatedTodoWeekSnapshot::where('repeated_todo_id', $repeatedTodoId)
            ->whereRaw('date(week_start) = ?', [$weekStartString])
            ->first();

        if ($snap !== null) {
            return $snap;
        }

        try {
            return RepeatedTodoWeekSnapshot::create([
                'repeated_todo_id' => $repeatedTodoId,
                'week_start' => $weekStartString,
                'mon' => false, 'tue' => false, 'wed' => false, 'thu' => false,
                'fri' => false, 'sat' => false, 'sun' => false,
            ]);
        } catch (UniqueConstraintViolationException $e) {
            $existing = RepeatedTodoWeekSnapshot::where('repeated_todo_id', $repeatedTodoId)
                ->whereRaw('date(week_start) = ?', [$weekStartString])
                ->first();
            if ($existing !== null) {
                return $existing;
            }
            throw $e;
        }
    }

    /** When loading, ensure past weeks are snapshotted (archived) so current week can start fresh. */
    public function ensureWeekArchived(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $today = Carbon::today();
        $currentWeekStart = $this->weekStart($today);
        $weekStartString = $currentWeekStart->toDateString();
        $repeatedTodos = RepeatedTodo::where('user_id', $userId)->get();
        foreach ($repeatedTodos as $rt) {
            $lastSnapshot = RepeatedTodoWeekSnapshot::where('repeated_todo_id', $rt->id)
                ->orderByDesc('week_start')
                ->first();
            $lastWeekStart = $lastSnapshot ? Carbon::parse($lastSnapshot->week_start) : null;
            if ($lastWeekStart && $lastWeekStart->lt($currentWeekStart)) {
                continue;
            }
            $hasCurrent = RepeatedTodoWeekSnapshot::where('repeated_todo_id', $rt->id)
                ->whereRaw('date(week_start) = ?', [$weekStartString])
                ->exists();
            if ($hasCurrent) {
                continue;
            }
            $this->ensureSnapshotForWeek($rt->id, $weekStartString);
        }
        return response()->json(['message' => 'OK']);
    }

    public function index(Request $request): JsonResponse
    {
        $this->ensureWeekArchived($request);
        $repeatedTodos = RepeatedTodo::where('user_id', $request->user()->id)
            ->orderBy('sort_order')
            ->with(['weekSnapshots' => function ($q) {
                $q->orderByDesc('week_start')->limit(2); // current + maybe last
            }])
            ->get();
        $currentWeekStart = $this->weekStart(Carbon::today())->toDateString();
        $list = $repeatedTodos->map(function (RepeatedTodo $rt) use ($currentWeekStart) {
            $snap = $rt->weekSnapshots->first(fn ($s) => $s->week_start->toDateString() === $currentWeekStart);
            return [
                'id' => $rt->id,
                'title' => $rt->title,
                'sort_order' => $rt->sort_order,
                'week' => $snap ? [
                    'mon' => $snap->mon, 'tue' => $snap->tue, 'wed' => $snap->wed,
                    'thu' => $snap->thu, 'fri' => $snap->fri, 'sat' => $snap->sat, 'sun' => $snap->sun,
                ] : [
                    'mon' => false, 'tue' => false, 'wed' => false, 'thu' => false,
                    'fri' => false, 'sat' => false, 'sun' => false,
                ],
            ];
        });
        return response()->json($list);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['title' => ['required', 'string', 'max:255']]);
        $data['user_id'] = $request->user()->id;
        $data['sort_order'] = RepeatedTodo::where('user_id', $request->user()->id)->max('sort_order') + 1;
        $repeatedTodo = RepeatedTodo::create($data);
        $currentWeekStart = $this->weekStart(Carbon::today())->toDateString();
        $this->ensureSnapshotForWeek($repeatedTodo->id, $currentWeekStart);
        return response()->json($repeatedTodo, 201);
    }

    public function update(Request $request, RepeatedTodo $repeatedTodo): JsonResponse
    {
        if ($repeatedTodo->user_id !== $request->user()->id) {
            abort(403);
        }
        $data = $request->validate(['title' => ['sometimes', 'string', 'max:255']]);
        $repeatedTodo->update($data);
        return response()->json($repeatedTodo);
    }

    public function destroy(Request $request, RepeatedTodo $repeatedTodo): JsonResponse
    {
        if ($repeatedTodo->user_id !== $request->user()->id) {
            abort(403);
        }
        $repeatedTodo->delete();
        return response()->json(null, 204);
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate(['order' => ['required', 'array'], 'order.*' => ['integer', 'exists:repeated_todos,id']]);
        $userId = $request->user()->id;
        foreach ($request->order as $index => $id) {
            RepeatedTodo::where('id', $id)->where('user_id', $userId)->update(['sort_order' => $index]);
        }
        return response()->json(['message' => 'OK']);
    }

    /** Toggle one day (mon-sun) for current week. Creates snapshot for new week if needed. */
    public function toggleDay(Request $request, RepeatedTodo $repeatedTodo): JsonResponse
    {
        if ($repeatedTodo->user_id !== $request->user()->id) {
            abort(403);
        }
        $request->validate(['day' => ['required', 'in:mon,tue,wed,thu,fri,sat,sun']]);
        $day = $request->day;
        $currentWeekStart = $this->weekStart(Carbon::today())->toDateString();
        $snap = $this->ensureSnapshotForWeek($repeatedTodo->id, $currentWeekStart);
        $snap->{$day} = ! $snap->{$day};
        $snap->save();
        return response()->json($snap);
    }
}
