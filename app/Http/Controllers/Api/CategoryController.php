<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = Category::where('user_id', $request->user()->id)
            ->with('children')
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'exists:categories,id'],
            'color' => ['nullable', 'string', 'max:20'],
        ]);
        $data['user_id'] = $request->user()->id;
        if (! empty($data['parent_id']) && ! Category::where('id', $data['parent_id'])->where('user_id', $request->user()->id)->exists()) {
            abort(403, 'Parent category does not belong to user');
        }
        $data['sort_order'] = Category::where('user_id', $request->user()->id)->max('sort_order') + 1;
        $category = Category::create($data);
        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $this->authorize('update', $category);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'parent_id' => ['nullable', 'exists:categories,id'],
            'color' => ['nullable', 'string', 'max:20'],
        ]);
        $category->update($data);
        return response()->json($category);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        $this->authorize('delete', $category);
        $category->delete();
        return response()->json(null, 204);
    }
}
