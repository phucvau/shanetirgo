"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type CollectionItem = {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  productCount: number;
  isActive?: boolean;
};

export function CollectionsSection() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/collections", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) return;

        const rows = Array.isArray(result) ? result : [];
        setCollections(rows.filter((item) => item?.isActive !== false).slice(0, 6));
      } catch {
        // keep empty
      }
    }

    load();
  }, []);

  if (collections.length === 0) {
    return null;
  }

  return (
    <section id="collections" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="mb-16 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">Bộ sưu tập</p>
        <h2 className="text-balance font-serif text-4xl font-bold text-foreground md:text-5xl">
          Đặc biệt dành riêng cho bạn
        </h2>
      </div>

      <Carousel opts={{ align: "start" }} className="px-2 md:px-4">
        <CarouselContent>
          {collections.map((col) => (
            <CarouselItem key={col.id} className="basis-full md:basis-1/2 lg:basis-1/3">
              <Link
                href={`/products?collection=${encodeURIComponent(col.slug)}`}
                className="group relative block overflow-hidden"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={col.imageUrl || "/images/collection-1.jpg"}
                    alt={col.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 flex flex-col justify-end bg-foreground/20 p-8 transition-colors group-hover:bg-foreground/40">
                  <h3 className="font-serif text-2xl font-bold text-background">{col.name}</h3>
                  <p className="mt-2 text-sm text-background/80">{col.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-background">
                    Khám phá
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-2 md:-left-5" />
        <CarouselNext className="-right-2 md:-right-5" />
      </Carousel>
    </section>
  );
}
