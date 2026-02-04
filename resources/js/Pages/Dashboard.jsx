import React from 'react';
import { Layout } from '@/Components/Layout';
import { TodayTodo } from '@/Components/TodayTodo';
import { RepeatedTodoPanel } from '@/Components/RepeatedTodoPanel';

export default function Dashboard() {
  return (
    <Layout>
      <div className="grid gap-5 lg:grid-cols-2 max-w-6xl">
        <div className="min-w-0">
          <TodayTodo />
        </div>
        <div className="min-w-0">
          <RepeatedTodoPanel />
        </div>
      </div>
    </Layout>
  );
}
