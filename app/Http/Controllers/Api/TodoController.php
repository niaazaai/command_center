<?php

namespace App\Http\Controllers\Api;

use App\Enums\TodoStatus;
use App\Http\Controllers\Controller;
use App\Models\Todo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TodoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $completedOnly = $request->boolean('completed');

        if ($completedOnly) {
            $todos = Todo::where('user_id', $userId)
                ->where('status', TodoStatus::Complete)
                ->with('category')
                ->orderByDesc('updated_at')
                ->get();
            return response()->json($todos);
        }

        $forDate = $request->get('for_date', today()->toDateString());
        $todos = Todo::where('user_id', $userId)
            ->where('status', '!=', TodoStatus::Complete->value)
            ->where(function ($q) use ($forDate) {
                $q->whereRaw('date(for_date) = ?', [$forDate])->orWhereNull('for_date');
            })
            ->with('category')
            ->orderBy('sort_order')
            ->get();
        return response()->json($todos);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'for_date' => ['nullable', 'date'],
        ]);
        $data['user_id'] = $request->user()->id;
        $data['status'] = TodoStatus::Today;
        $data['for_date'] = $data['for_date'] ?? today()->toDateString();
        $data['sort_order'] = Todo::where('user_id', $request->user()->id)->max('sort_order') + 1;
        $todo = Todo::create($data);
        $todo->load('category');
        return response()->json($todo, 201);
    }

    public function update(Request $request, Todo $todo): JsonResponse
    {
        if ($todo->user_id !== $request->user()->id) {
            abort(403);
        }
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'status' => ['sometimes', Rule::enum(TodoStatus::class)],
        ]);
        $todo->update($data);
        $todo->load('category');
        return response()->json($todo);
    }

    public function destroy(Request $request, Todo $todo): JsonResponse
    {
        if ($todo->user_id !== $request->user()->id) {
            abort(403);
        }
        $todo->delete();
        return response()->json(null, 204);
    }

    /** Reorder todos and set status by position: above "Pending" section = today/under_process, below = pending */
    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer', 'exists:todos,id'],
            'pending_start_index' => ['required', 'integer', 'min:0'], // index at which "Pending" section starts
        ]);
        $userId = $request->user()->id;
        $pendingStart = (int) $request->pending_start_index;
        foreach ($request->order as $index => $id) {
            $status = $index < $pendingStart ? TodoStatus::UnderProcess : TodoStatus::Pending;
            Todo::where('id', $id)->where('user_id', $userId)->update([
                'sort_order' => $index,
                'status' => $status->value,
            ]);
        }
        return response()->json(['message' => 'OK']);
    }
}
