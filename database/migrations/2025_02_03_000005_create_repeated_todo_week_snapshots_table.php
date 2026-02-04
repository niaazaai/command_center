<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repeated_todo_week_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('repeated_todo_id')->constrained()->cascadeOnDelete();
            $table->date('week_start'); // Monday of the week
            $table->boolean('mon')->default(false);
            $table->boolean('tue')->default(false);
            $table->boolean('wed')->default(false);
            $table->boolean('thu')->default(false);
            $table->boolean('fri')->default(false);
            $table->boolean('sat')->default(false);
            $table->boolean('sun')->default(false);
            $table->timestamps();
            $table->unique(['repeated_todo_id', 'week_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repeated_todo_week_snapshots');
    }
};
