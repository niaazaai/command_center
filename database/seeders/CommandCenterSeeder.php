<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Idea;
use App\Models\Note;
use App\Models\Reminder;
use App\Models\RepeatedTodo;
use App\Models\RepeatedTodoWeekSnapshot;
use App\Models\Todo;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CommandCenterSeeder extends Seeder
{
    /**
     * Seed the command center with one user and sample data.
     */
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'maseeh.niazaai@gmail.com'],
            [
                'name' => 'Maseeh Niazaai',
                'password' => Hash::make('195068'),
                'email_verified_at' => now(),
            ]
        );

        // Categories (main + sub)
        $work = Category::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Work'],
            ['parent_id' => null, 'sort_order' => 0]
        );
        $personal = Category::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Personal'],
            ['parent_id' => null, 'sort_order' => 1]
        );
        Category::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Urgent', 'parent_id' => $work->id],
            ['sort_order' => 0]
        );

        // Reminders
        $reminders = [
            ['title' => 'Team standup', 'remind_at' => now()->addDays(1)->setHour(9)->setMinute(0)],
            ['title' => 'Submit report', 'remind_at' => now()->addDays(2)->setHour(17)->setMinute(0)],
        ];
        foreach ($reminders as $i => $r) {
            Reminder::firstOrCreate(
                ['user_id' => $user->id, 'title' => $r['title']],
                ['remind_at' => $r['remind_at'], 'sort_order' => $i]
            );
        }

        // Today todos
        $today = now()->toDateString();
        $todos = [
            ['title' => 'Review PRs', 'category_id' => $work->id, 'status' => 'today'],
            ['title' => 'Exercise', 'category_id' => $personal->id, 'status' => 'today'],
            ['title' => 'Backlog task', 'category_id' => null, 'status' => 'pending'],
        ];
        foreach ($todos as $i => $t) {
            Todo::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'title' => $t['title'],
                    'for_date' => $today,
                ],
                [
                    'category_id' => $t['category_id'] ?? null,
                    'status' => $t['status'],
                    'sort_order' => $i,
                ]
            );
        }

        // Repeated todos + current week snapshot
        $weekStart = Carbon::today()->startOfWeek(Carbon::MONDAY)->toDateString();
        $repeatedTitles = ['Prayer', 'Daily Quran 15min', 'Gym'];
        foreach ($repeatedTitles as $i => $title) {
            $rt = RepeatedTodo::firstOrCreate(
                ['user_id' => $user->id, 'title' => $title],
                ['sort_order' => $i]
            );
            RepeatedTodoWeekSnapshot::firstOrCreate(
                ['repeated_todo_id' => $rt->id, 'week_start' => $weekStart],
                [
                    'mon' => false, 'tue' => true, 'wed' => false, 'thu' => true,
                    'fri' => false, 'sat' => false, 'sun' => false,
                ]
            );
        }

        // Notes
        $notes = [
            ['title' => 'Meeting notes', 'content' => "Action items:\n- Follow up with design\n- Send draft by Friday"],
            ['title' => 'Quick reminder', 'content' => 'Call mom this weekend'],
        ];
        foreach ($notes as $n) {
            Note::firstOrCreate(
                ['user_id' => $user->id, 'title' => $n['title']],
                ['content' => $n['content']]
            );
        }

        // Ideas
        $ideas = [
            ['title' => 'Side project', 'content' => 'Build a small CLI tool for daily logs'],
            ['title' => 'Learning', 'content' => 'Try the new Laravel features'],
        ];
        foreach ($ideas as $idea) {
            Idea::firstOrCreate(
                ['user_id' => $user->id, 'title' => $idea['title']],
                ['content' => $idea['content']]
            );
        }

        $this->command?->info('Command Center seeded. Login: test@example.com / password');
    }
}
