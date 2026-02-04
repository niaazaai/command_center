<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notes = Note::where('user_id', $request->user()->id)->orderByDesc('updated_at')->get();
        return response()->json($notes);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
        ]);
        $data['user_id'] = $request->user()->id;
        $note = Note::create($data);
        return response()->json($note, 201);
    }

    public function show(Request $request, Note $note): JsonResponse
    {
        if ($note->user_id !== $request->user()->id) {
            abort(404);
        }
        return response()->json($note);
    }

    public function update(Request $request, Note $note): JsonResponse
    {
        if ($note->user_id !== $request->user()->id) {
            abort(403);
        }
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
        ]);
        $note->update($data);
        return response()->json($note);
    }

    public function destroy(Request $request, Note $note): JsonResponse
    {
        if ($note->user_id !== $request->user()->id) {
            abort(403);
        }
        $note->delete();
        return response()->json(null, 204);
    }
}
