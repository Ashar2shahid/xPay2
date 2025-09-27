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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { mockChains } from "@/data/mockData";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useStore } from "../../store";
import { ChainSymbol } from "@/app/components";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters"),
  chainIds: z.array(z.string()).min(1, "Please select at least one chain"),
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
      chainIds: [],
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    const chains = mockChains.filter((c) => data.chainIds.includes(c.id));
    if (chains.length === 0) {
      toast({
        title: "Error",
        description: "Selected chains not found.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const newProject = {
      name: data.name,
      description: data.description,
      chain: chains,
      endpoints: [],
      totalRequests: 0,
      avgLatency: 0,
      successRate: 0,
    };

    const newId = addProject(newProject);

    toast({
      title: "Project created successfully",
      description: `${data.name} has been created.`,
    });

    setIsSubmitting(false);
    router.push(`/project/${newId}`);
  };

  const selectedChains = mockChains.filter((chain) =>
    form.watch("chainIds").includes(chain.id)
  );

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
                      name="chainIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blockchain Networks</FormLabel>
                          <div className="space-y-3">
                            <div className="relative">
                              <Select>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue>
                                      {field.value.length === 0 ? (
                                        "Select blockchain networks"
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <span>
                                            {field.value.length} network
                                            {field.value.length !== 1
                                              ? "s"
                                              : ""}{" "}
                                            selected
                                          </span>
                                          <div className="flex items-center gap-1 ml-2">
                                            {field.value
                                              .slice(0, 3)
                                              .map((chainId) => {
                                                const chain = mockChains.find(
                                                  (c) => c.id === chainId
                                                );
                                                return chain ? (
                                                  <ChainSymbol
                                                    key={chainId}
                                                    symbol={chain.symbol}
                                                    size="xs"
                                                  />
                                                ) : null;
                                              })}
                                            {field.value.length > 3 && (
                                              <span className="text-xs text-muted-foreground">
                                                +{field.value.length - 3}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </SelectValue>
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {selectedChains.length > 0 && (
                                    <div className="sticky top-0 z-10 bg-popover/80 backdrop-blur supports-[backdrop-filter]:bg-popover/60 border-b border-border px-2 py-2">
                                      <div className="flex items-center gap-1 overflow-x-auto">
                                        {selectedChains.map((chain) => (
                                          <div
                                            key={chain.id}
                                            className="p-1 border border-border rounded bg-background"
                                            title={chain.name}
                                          >
                                            <ChainSymbol
                                              symbol={chain.symbol}
                                              size="xs"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {mockChains.map((chain) => (
                                    <SelectItem
                                      key={chain.id}
                                      value={chain.id}
                                      onSelect={() => {
                                        const currentValue = field.value || [];
                                        if (currentValue.includes(chain.id)) {
                                          field.onChange(
                                            currentValue.filter(
                                              (id) => id !== chain.id
                                            )
                                          );
                                        } else {
                                          field.onChange([
                                            ...currentValue,
                                            chain.id,
                                          ]);
                                        }
                                      }}
                                    >
                                      <div className="flex items-center gap-2 w-full">
                                        <input
                                          type="checkbox"
                                          checked={field.value.includes(
                                            chain.id
                                          )}
                                          onChange={() => {}} // Handled by onSelect
                                          className="rounded border-border"
                                        />
                                        <ChainSymbol
                                          symbol={chain.symbol}
                                          size="sm"
                                        />
                                        <span>{chain.name}</span>
                                        <span className="text-xs text-muted-foreground ml-auto">
                                          {chain.symbol}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Select one or more blockchain networks for your
                              project
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedChains.length > 0 && (
                      <div className="p-4 bg-muted text-sm space-y-3 rounded-md">
                        <div className="font-medium text-foreground">
                          Selected Networks ({selectedChains.length})
                        </div>
                        <div className="space-y-2">
                          {selectedChains.map((chain) => (
                            <div
                              key={chain.id}
                              className="flex items-center gap-2"
                            >
                              <ChainSymbol symbol={chain.symbol} size="sm" />
                              <div className="flex-1">
                                <div className="font-medium">{chain.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Chain ID: {chain.chainId} •{" "}
                                  {chain.explorerUrl}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
