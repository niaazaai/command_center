<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\IdeaController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Api\ReminderController;
use App\Http\Controllers\Api\RepeatedTodoController;
use App\Http\Controllers\Api\TodoController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('categories', CategoryController::class);
    Route::get('reminders', [ReminderController::class, 'index']);
    Route::post('reminders', [ReminderController::class, 'store']);
    Route::put('reminders/reorder', [ReminderController::class, 'reorder']);
    Route::put('reminders/{reminder}', [ReminderController::class, 'update']);
    Route::delete('reminders/{reminder}', [ReminderController::class, 'destroy']);

    Route::get('todos', [TodoController::class, 'index']);
    Route::post('todos', [TodoController::class, 'store']);
    Route::put('todos/reorder', [TodoController::class, 'reorder']);
    Route::put('todos/{todo}', [TodoController::class, 'update']);
    Route::delete('todos/{todo}', [TodoController::class, 'destroy']);

    Route::get('repeated-todos', [RepeatedTodoController::class, 'index']);
    Route::post('repeated-todos', [RepeatedTodoController::class, 'store']);
    Route::put('repeated-todos/reorder', [RepeatedTodoController::class, 'reorder']);
    Route::put('repeated-todos/{repeated_todo}/toggle', [RepeatedTodoController::class, 'toggleDay']);
    Route::put('repeated-todos/{repeated_todo}', [RepeatedTodoController::class, 'update']);
    Route::delete('repeated-todos/{repeated_todo}', [RepeatedTodoController::class, 'destroy']);

    Route::apiResource('notes', NoteController::class);
    Route::apiResource('ideas', IdeaController::class);
});
