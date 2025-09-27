"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useStore } from "../../store";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters"),
  payTo: z
    .string()
    .min(1, "Wallet address is required")
    .max(200, "Address must be less than 200 characters"),
  defaultPrice: z.number().min(0, "Price must be 0 or greater").optional(),
  currency: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateProject() {
  const router = useRouter();
  const { addProject } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      payTo: "",
      defaultPrice: 0,
      currency: "USD",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    const newProject = {
      name: data.name,
      description: data.description,
      payTo: data.payTo,
      paymentChains: [], // Start with empty payment chains
      defaultPrice: data.defaultPrice || 0,
      currency: data.currency || "USD",
    };

    try {
      const newId = await addProject(newProject);

      toast({
        title: "Project created successfully",
        description: `${data.name} has been created.`,
      });

      setIsSubmitting(false);
      router.push(`/project/${await newId}`);
    } catch (error) {
      console.error("Failed to create project:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="border-b border-border pb-6 md:pb-8 mb-8 md:mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-gradient-primary flex items-center justify-center shadow-sm">
                <Plus className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Create New Project
              </h1>
            </div>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              Set up a new endpoint monitoring project
            </p>
          </div>
        </div>

        <Card className="p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Project Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4">
                    Project Details
                  </h2>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My DeFi Project" {...field} />
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
                            <Textarea
                              placeholder="Describe your project and its purpose..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="payTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="0x1234...abcd or wallet.eth"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="defaultPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <FormControl>
                              <Input placeholder="USD" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 sm:gap-4 pt-6 border-t border-border justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-primary hover:opacity-90 text-primary-foreground border-0"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </main>
  );
}
