import React from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';

export default function Login() {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm rounded-xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-2 pt-6 px-6 border-b border-border/80">
          <div className="flex justify-center mb-2">
            <img src="/main-logo.svg" alt="" className="h-12 w-12" aria-hidden />
          </div>
          <h1 className="text-xl font-semibold text-center">Command Center</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">Sign in to your account</p>
        </CardHeader>
        <CardContent className="pt-6 px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.email && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">{errors.email}</p>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                required
                className="mt-1 rounded-lg"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                required
                className="mt-1 rounded-lg"
              />
            </div>
            <Button type="submit" className="w-full rounded-lg" disabled={processing}>
              {processing ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
