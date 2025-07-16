"use client";
import React, { useEffect, useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { World, WorldFormSchema } from "world_schema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function WorldsPage() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(WorldFormSchema),
    defaultValues: {
      name: "",
      description: "",
      theme: "fantasy",
      contextWindowLimit: 1024,
    },
  });

  // Fetch worlds on mount
  useEffect(() => {
    async function fetchWorlds() {
      setLoading(true);
      const res = await fetch("/api/worlds");
      const data = await res.json();
      setWorlds(data);
      setLoading(false);
    }
    fetchWorlds();
  }, []);

  const onSubmit = async (data: Partial<World>) => {
    const res = await fetch("/api/worlds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const newWorld = await res.json();
    setWorlds((prev) => [...prev, newWorld]);
    form.reset();
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Worlds</h1>
      <p>Browse all available worlds here.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
        {loading ? (
          <div>Loading...</div>
        ) : (
          worlds.map((world) => (
            <Card key={world.id}>
              <CardHeader>
                <CardTitle>{world.name}</CardTitle>
                <CardDescription>{world.theme}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>{world.description}</p>
                <p className="text-xs text-muted-foreground mt-2">Context Window Limit: {world.contextWindowLimit}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Create World</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New World</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme</FormLabel>
                    <FormControl>
                      <Select {...field} onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fantasy">Fantasy</SelectItem>
                          <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="historical">Historical</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contextWindowLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Context Window Limit</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

