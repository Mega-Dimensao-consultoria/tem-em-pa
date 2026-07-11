import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo2,
  Redo2,
  Link as LinkIcon,
  Image as ImageIcon,
  Loader2,
  Unlink,
  Code2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { sanitizeHtml } from "@/features/blog/lib/sanitize";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  uploadImage: (file: File) => Promise<string>;
  className?: string;
  minHeight?: number;
};

/**
 * Editor WYSIWYG baseado em Tiptap.
 * Uso: páginas do site e posts do blog. Serializa HTML sanitizado no save.
 */
export function RichEditor({
  value,
  onChange,
  placeholder = "Comece a escrever…",
  uploadImage,
  className,
  minHeight = 360,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    // Evita mismatch de hidratação no SSR do TanStack Start.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral max-w-none dark:prose-invert focus:outline-none " +
          "prose-headings:font-display prose-a:text-primary min-h-[inherit] px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Se o valor externo mudar (ex: restaurar versão), sincroniza.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  async function handleFile(file: File) {
    if (!editor) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name.replace(/\.[^.]+$/, "") }).run();
      toast.success("Imagem inserida");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function toggleLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link:", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-background shadow-soft",
        className,
      )}
    >
      <Toolbar
        editor={editor}
        onImageClick={() => fileInputRef.current?.click()}
        onLinkClick={toggleLink}
        uploading={uploading}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

/** Exporta HTML sanitizado para salvar no banco. */
export function toSafeHtml(html: string): string {
  return sanitizeHtml(html);
}

function Toolbar({
  editor,
  onImageClick,
  onLinkClick,
  uploading,
}: {
  editor: Editor | null;
  onImageClick: () => void;
  onLinkClick: () => void;
  uploading: boolean;
}) {
  if (!editor) return <div className="h-11 border-b border-border bg-muted/40" />;

  const buttons: Array<{
    key: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
  }> = [
    {
      key: "bold",
      icon: <Bold className="h-4 w-4" />,
      label: "Negrito",
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      key: "italic",
      icon: <Italic className="h-4 w-4" />,
      label: "Itálico",
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      key: "strike",
      icon: <Strikethrough className="h-4 w-4" />,
      label: "Tachado",
      onClick: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive("strike"),
    },
    {
      key: "h2",
      icon: <Heading2 className="h-4 w-4" />,
      label: "Título 2",
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
    },
    {
      key: "h3",
      icon: <Heading3 className="h-4 w-4" />,
      label: "Título 3",
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive("heading", { level: 3 }),
    },
    {
      key: "ul",
      icon: <List className="h-4 w-4" />,
      label: "Lista",
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
    },
    {
      key: "ol",
      icon: <ListOrdered className="h-4 w-4" />,
      label: "Lista numerada",
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
    },
    {
      key: "quote",
      icon: <Quote className="h-4 w-4" />,
      label: "Citação",
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote"),
    },
    {
      key: "code",
      icon: <Code className="h-4 w-4" />,
      label: "Código",
      onClick: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive("code"),
    },
    {
      key: "link",
      icon: <LinkIcon className="h-4 w-4" />,
      label: "Link",
      onClick: onLinkClick,
      isActive: editor.isActive("link"),
    },
    {
      key: "unlink",
      icon: <Unlink className="h-4 w-4" />,
      label: "Remover link",
      onClick: () => editor.chain().focus().unsetLink().run(),
      disabled: !editor.isActive("link"),
    },
    {
      key: "image",
      icon: uploading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ImageIcon className="h-4 w-4" />
      ),
      label: "Inserir imagem",
      onClick: onImageClick,
      disabled: uploading,
    },
    {
      key: "undo",
      icon: <Undo2 className="h-4 w-4" />,
      label: "Desfazer",
      onClick: () => editor.chain().focus().undo().run(),
      disabled: !editor.can().undo(),
    },
    {
      key: "redo",
      icon: <Redo2 className="h-4 w-4" />,
      label: "Refazer",
      onClick: () => editor.chain().focus().redo().run(),
      disabled: !editor.can().redo(),
    },
  ];

  return (
    <div
      role="toolbar"
      aria-label="Formatação"
      className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-1.5"
    >
      {buttons.map((b) => (
        <Button
          key={b.key}
          type="button"
          size="icon"
          variant={b.isActive ? "default" : "ghost"}
          className="h-8 w-8"
          onClick={b.onClick}
          disabled={b.disabled}
          aria-label={b.label}
          title={b.label}
        >
          {b.icon}
        </Button>
      ))}
    </div>
  );
}
