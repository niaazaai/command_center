<?php

namespace App\Enums;

enum TodoStatus: string
{
    case Today = 'today';
    case Pending = 'pending';
    case Complete = 'complete';
    case UnderProcess = 'under_process';

    /** Values allowed in API / validation. */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
