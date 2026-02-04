<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class TodoListController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Todos');
    }

    public function completed(): Response
    {
        return Inertia::render('CompletedTodos');
    }
}
