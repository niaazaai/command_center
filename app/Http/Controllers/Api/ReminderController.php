<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reminder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $reminders = Reminder::where('user_id', $request->user()->id)
            ->orderBy('sort_order')
            ->orderByRaw('CASE WHEN remind_at IS NULL THEN 1 ELSE 0 END') // permanent first
            ->orderBy('remind_at')
            ->get();
        return response()->json($reminders);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'remind_at' => ['nullable', 'date'],
        ]);
        $data['user_id'] = $request->user()->id;
        $data['sort_order'] = Reminder::where('user_id', $request->user()->id)->max('sort_order') + 1;
        $reminder = Reminder::create($data);
        return response()->json($reminder, 201);
    }

    public function update(Request $request, Reminder $reminder): JsonResponse
    {
        if ($reminder->user_id !== $request->user()->id) {
            abort(403);
        }
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'remind_at' => ['nullable', 'date'],
        ]);
        $reminder->update($data);
        return response()->json($reminder);
    }

    public function destroy(Request $request, Reminder $reminder): JsonResponse
    {
        if ($reminder->user_id !== $request->user()->id) {
            abort(403);
        }
        $reminder->delete();
        return response()->json(null, 204);
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate(['order' => ['required', 'array'], 'order.*' => ['integer', 'exists:reminders,id']]);
        $userId = $request->user()->id;
        foreach ($request->order as $index => $id) {
            Reminder::where('id', $id)->where('user_id', $userId)->update(['sort_order' => $index]);
        }
        return response()->json(['message' => 'OK']);
    }
}
