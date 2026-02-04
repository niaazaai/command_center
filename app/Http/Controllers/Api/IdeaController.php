<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Idea;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IdeaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $ideas = Idea::where('user_id', $request->user()->id)->orderByDesc('updated_at')->get();
        return response()->json($ideas);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
        ]);
        $data['user_id'] = $request->user()->id;
        $idea = Idea::create($data);
        return response()->json($idea, 201);
    }

    public function show(Request $request, Idea $idea): JsonResponse
    {
        if ($idea->user_id !== $request->user()->id) {
            abort(404);
        }
        return response()->json($idea);
    }

    public function update(Request $request, Idea $idea): JsonResponse
    {
        if ($idea->user_id !== $request->user()->id) {
            abort(403);
        }
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
        ]);
        $idea->update($data);
        return response()->json($idea);
    }

    public function destroy(Request $request, Idea $idea): JsonResponse
    {
        if ($idea->user_id !== $request->user()->id) {
            abort(403);
        }
        $idea->delete();
        return response()->json(null, 204);
    }
}
