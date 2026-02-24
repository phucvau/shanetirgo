"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Palette,
  Redo2,
  Underline,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  value: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<string>;
};

export function RichTextEditor({ value, onChange, onUploadImage }: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const colorInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imageWidth, setImageWidth] = useState("100");

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  function runCommand(command: string, arg?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    setSelectedImage(null);
    onChange(editorRef.current?.innerHTML || "");
  }

  async function handleInsertImage(file: File) {
    const imageUrl = await onUploadImage(file);
    runCommand("insertImage", imageUrl);
  }

  function refreshSelectedImage() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setSelectedImage(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    const element = node.nodeType === 1 ? (node as Element) : node.parentElement;
    const image = element?.closest("img") || null;
    if (image instanceof HTMLImageElement) {
      setSelectedImage(image);
      const width = image.style.width?.replace("%", "") || "100";
      setImageWidth(width);
      return;
    }
    setSelectedImage(null);
  }

  function setImageWidthPercent(next: string) {
    if (!selectedImage) return;
    const safe = Math.min(100, Math.max(20, Number(next) || 100));
    selectedImage.style.width = `${safe}%`;
    selectedImage.style.height = "auto";
    selectedImage.style.display = "block";
    selectedImage.style.margin = "0.8rem 0";
    setImageWidth(String(safe));
    onChange(editorRef.current?.innerHTML || "");
  }

  const toolButtons = useMemo(
    () => [
      { label: "H1", icon: Heading1, action: () => runCommand("formatBlock", "<h1>") },
      { label: "H2", icon: Heading2, action: () => runCommand("formatBlock", "<h2>") },
      { label: "Đậm", icon: Bold, action: () => runCommand("bold") },
      { label: "Nghiêng", icon: Italic, action: () => runCommand("italic") },
      { label: "Gạch chân", icon: Underline, action: () => runCommand("underline") },
      { label: "Bullet", icon: List, action: () => runCommand("insertUnorderedList") },
      { label: "Số", icon: ListOrdered, action: () => runCommand("insertOrderedList") },
      { label: "Trái", icon: AlignLeft, action: () => runCommand("justifyLeft") },
      { label: "Giữa", icon: AlignCenter, action: () => runCommand("justifyCenter") },
      { label: "Phải", icon: AlignRight, action: () => runCommand("justifyRight") },
      { label: "Undo", icon: Undo2, action: () => runCommand("undo") },
      { label: "Redo", icon: Redo2, action: () => runCommand("redo") },
    ],
    []
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 rounded-md border bg-muted/40 p-2">
        {toolButtons.map((tool) => (
          <Button key={tool.label} type="button" variant="outline" size="sm" onClick={tool.action}>
            <tool.icon className="mr-1 h-4 w-4" /> {tool.label}
          </Button>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => colorInputRef.current?.click()}
        >
          <Palette className="mr-1 h-4 w-4" /> Màu chữ
        </Button>
        <input
          ref={colorInputRef}
          type="color"
          className="hidden"
          onChange={(e) => runCommand("foreColor", e.target.value)}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const current = window.getSelection()?.toString() || "";
            const href = window.prompt("Nhập link URL:", "https://");
            if (!href) return;
            if (current) {
              runCommand("createLink", href);
              return;
            }
            runCommand("insertHTML", `<a href="${href}" target="_blank" rel="noreferrer">${href}</a>`);
          }}
        >
          <Link2 className="mr-1 h-4 w-4" /> Link
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="mr-1 h-4 w-4" /> Chèn ảnh
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              await handleInsertImage(file);
            } finally {
              e.currentTarget.value = "";
            }
          }}
        />
      </div>

      {selectedImage ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md border bg-background p-3 text-sm">
          <span className="text-muted-foreground">Kích thước ảnh</span>
          <Input
            type="range"
            min="20"
            max="100"
            step="5"
            value={imageWidth}
            onChange={(e) => setImageWidthPercent(e.target.value)}
            className="w-44"
          />
          <span className="w-10 text-right font-medium">{imageWidth}%</span>
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((percent) => (
              <Button key={percent} type="button" size="sm" variant="outline" onClick={() => setImageWidthPercent(String(percent))}>
                {percent}%
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="rich-content min-h-[240px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        onInput={() => onChange(editorRef.current?.innerHTML || "")}
        onMouseUp={refreshSelectedImage}
        onKeyUp={refreshSelectedImage}
        onClick={(event) => {
          if (event.target instanceof HTMLImageElement) {
            setSelectedImage(event.target);
            const width = event.target.style.width?.replace("%", "") || "100";
            setImageWidth(width);
          }
        }}
      />
    </div>
  );
}
