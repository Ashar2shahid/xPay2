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
import { Plus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useStore } from "../../store";
import { ChainSelectDropdown } from "@/app/components/ChainSelectDropdown";

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
  paymentChains: z
    .array(z.string())
    .min(1, "At least one payment chain must be selected"),
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
      paymentChains: [],
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    const newProject = {
      name: data.name,
      description: data.description,
      payTo: data.payTo,
      paymentChains: data.paymentChains,
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
    <div className="border-5 border-base-600 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Floating Window Container */}
        <div className="rounded-xl overflow-hidden shadow-window-large border border-base-500">
          {/* Window Bar Header */}
          <div className="flex items-center justify-between p-2 bg-muted/30 border-b border-base-500">
            {/* Left: Icon */}
            <div className="flex items-center gap-1">
              <div className="h-5 w-5 rounded-sm bg-gradient-primary flex items-center justify-center">
                <Plus className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>

            {/* Center: Title */}
            <div className="flex-1 text-center">
              <h1 className="text-sm font-semibold text-foreground font-display truncate px-2">
                Create Project
              </h1>
            </div>

            {/* Right: Control Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => router.push("/")}
                className="w-5 h-5 rounded-sm hover:bg-muted flex items-center justify-center transition-colors border border-base-500"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Window Content */}
          <div className="p-6 md:p-8 bg-background">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                {/* Project Details */}
                <div className="space-y-6">
                  <div>
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

                      <FormField
                        control={form.control}
                        name="paymentChains"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Chains</FormLabel>
                            <FormControl>
                              <ChainSelectDropdown
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Select supported payment chains"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
          </div>
        </div>
      </div>
    </div>
  );
}
