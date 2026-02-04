<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\IdeaController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\ReminderListController;
use App\Http\Controllers\TodoListController;
use Illuminate\Support\Facades\Route;

Route::get('/login', [LoginController::class, 'create'])->name('login')->middleware('guest');
Route::post('/login', [LoginController::class, 'store'])->middleware('guest');
Route::get('/register', [RegisterController::class, 'create'])->middleware('guest');
Route::post('/register', [RegisterController::class, 'store'])->middleware('guest');

Route::middleware('auth')->group(function () {
    Route::get('/', [DashboardController::class, '__invoke'])->name('dashboard');
    Route::get('/todos', [TodoListController::class, '__invoke'])->name('todos');
    Route::get('/completed-todos', [TodoListController::class, 'completed'])->name('completed-todos');
    Route::get('/reminders', [ReminderListController::class, '__invoke'])->name('reminders');
    Route::get('/notes', [NoteController::class, 'index'])->name('notes');
    Route::get('/ideas', [IdeaController::class, 'index'])->name('ideas');
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');
});
