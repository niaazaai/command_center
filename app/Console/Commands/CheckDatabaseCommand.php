<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckDatabaseCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:check
                            {--seed : Run seeders after successful check}
                            {--migrate : Run migrations before seed}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check if the database (MySQL) is reachable and optionally run migrate/seed';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $driver = config('database.default');

        if ($driver !== 'mysql') {
            $this->warn("Default connection is [{$driver}]. Set DB_CONNECTION=mysql in .env to use MySQL.");
        }

        try {
            DB::connection()->getPdo();
            DB::connection()->getDatabaseName();
        } catch (\Throwable $e) {
            $this->error('Database connection failed.');
            $this->error($e->getMessage());
            $this->newLine();
            $this->info('Ensure MySQL is running and .env has correct DB_* values:');
            $this->line('  DB_CONNECTION=mysql');
            $this->line('  DB_HOST=127.0.0.1');
            $this->line('  DB_PORT=3306');
            $this->line('  DB_DATABASE=command_center');
            $this->line('  DB_USERNAME=root');
            $this->line('  DB_PASSWORD=');
            return self::FAILURE;
        }

        $this->info('Database connection OK (' . DB::connection()->getDatabaseName() . ').');

        if ($this->option('migrate')) {
            $this->call('migrate', ['--force' => true]);
        }

        if ($this->option('seed')) {
            $this->call('db:seed', ['--force' => true]);
        }

        return self::SUCCESS;
    }
}
