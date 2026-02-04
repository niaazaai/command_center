<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RepeatedTodoWeekSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'repeated_todo_id', 'week_start',
        'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
    ];

    protected function casts(): array
    {
        return [
            'week_start' => 'date',
            'mon' => 'boolean', 'tue' => 'boolean', 'wed' => 'boolean',
            'thu' => 'boolean', 'fri' => 'boolean', 'sat' => 'boolean', 'sun' => 'boolean',
        ];
    }

    public function repeatedTodo(): BelongsTo
    {
        return $this->belongsTo(RepeatedTodo::class, 'repeated_todo_id');
    }
}
