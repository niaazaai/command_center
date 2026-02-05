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
        $query = Note::where('user_id', $request->user()->id)->with('category');
        if ($request->has('category_id') && $request->category_id !== '' && $request->category_id !== null) {
            $query->where('category_id', $request->category_id);
        }
        $notes = $query->orderByDesc('updated_at')->get();
        return response()->json($notes);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'category_id' => ['nullable', 'exists:categories,id'],
        ]);
        $data['user_id'] = $request->user()->id;
        if (!empty($data['category_id']) && !\App\Models\Category::where('id', $data['category_id'])->where('user_id', $request->user()->id)->exists()) {
            abort(403, 'Category does not belong to user');
        }
        $note = Note::create($data);
        $note->load('category');
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
            'category_id' => ['nullable', 'exists:categories,id'],
        ]);
        if (array_key_exists('category_id', $data) && $data['category_id'] !== null && !\App\Models\Category::where('id', $data['category_id'])->where('user_id', $request->user()->id)->exists()) {
            abort(403, 'Category does not belong to user');
        }
        $note->update($data);
        $note->load('category');
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
