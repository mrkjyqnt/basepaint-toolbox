"use client";

import { useEffect, useState, useCallback } from "react";
import { ThemeData } from "@/shared/types";
import { getDay, fetchTheme } from "@/features/theme";
import StrokePanel from "@/features/stroke/StrokePanel";
import AnimationPanel from "@/features/animation/AnimationPanel";
import ColorReplacePanel from "@/features/color-replace/ColorReplacePanel";
import CanvasExplorerPanel from "@/features/canvas-explorer/CanvasExplorerPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Sun } from "lucide-react";

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export default function Home() {
  const [theme, setTheme] = useState<ThemeData | null>(null);
  const [day] = useState(() => getDay());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTheme(day)
      .then((data) => {
        setTheme(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load theme:", err);
        setLoading(false);
      });
  }, [day]);

  const handleSkip = () => {
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6 sm:p-8 text-center">
          <div className="flex justify-end mb-2">
            <ThemeToggle />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">BASEPAINT TOOLBOX</h1>
          <p className="text-sm mb-4">Loading theme data...</p>
          <p className="text-sm text-muted-foreground mb-4">
            If it takes too long, the API might be slow.
          </p>
          <Button variant="outline" onClick={handleSkip}>
            Skip &amp; Continue Without Theme
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between mb-1">
          <div />
          <h1 className="text-3xl sm:text-4xl font-bold">BASEPAINT TOOLBOX</h1>
          <ThemeToggle />
        </div>
        {theme ? (
          <p className="text-center text-base sm:text-lg text-muted-foreground mb-6">
            Day {day} — {theme.theme}
          </p>
        ) : (
          <p className="text-center text-sm text-muted-foreground mb-6">
            Theme not loaded — some features require theme data
          </p>
        )}

        {/* Tabs */}
        <Tabs defaultValue={theme ? "singleImage" : "canvasExplorer"} className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="singleImage" disabled={!theme}>Frames</TabsTrigger>
            <TabsTrigger value="animation" disabled={!theme}>Animation</TabsTrigger>
            <TabsTrigger value="colorReplace">Colors</TabsTrigger>
            <TabsTrigger value="canvasExplorer">Canvas</TabsTrigger>
          </TabsList>

          <TabsContent value="singleImage" className="mt-4">
            {theme && <StrokePanel theme={theme} />}
          </TabsContent>

          <TabsContent value="animation" className="mt-4">
            {theme && <AnimationPanel theme={theme} />}
          </TabsContent>

          <TabsContent value="colorReplace" className="mt-4">
            <ColorReplacePanel />
          </TabsContent>

          <TabsContent value="canvasExplorer" className="mt-4">
            <CanvasExplorerPanel />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
