import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, LinkIcon, ImageIcon, Undo, Redo } from 'lucide-react';
import { uploadImage } from '../../api/admin.api';
import toast from 'react-hot-toast';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }),
      Image,
      Placeholder.configure({ placeholder: 'Soạn nội dung bài viết ở đây...' })
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[320px] px-4 py-3'
      }
    }
  });

  if (!editor) return null;

  const handleInsertImage = async (file: File) => {
    try {
      const res = await uploadImage(file, 'blog');
      editor.chain().focus().setImage({ src: res.data.url }).run();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải ảnh lên');
    }
  };

  const handleInsertLink = () => {
    const url = window.prompt('Nhập đường dẫn liên kết:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
    }
  };

  const ToolbarButton = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-2 rounded-lg transition-all ${active ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="flex items-center gap-1 px-2 py-2 border-b border-zinc-100 bg-slate-50/60 flex-wrap">
        <ToolbarButton title="Đậm" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton title="Nghiêng" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton title="Tiêu đề H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton title="Tiêu đề H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={14} />
        </ToolbarButton>
        <ToolbarButton title="Danh sách gạch đầu dòng" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton title="Danh sách đánh số" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={14} />
        </ToolbarButton>
        <ToolbarButton title="Chèn liên kết" active={editor.isActive('link')} onClick={handleInsertLink}>
          <LinkIcon size={14} />
        </ToolbarButton>
        <ToolbarButton title="Chèn ảnh" onClick={() => imageInputRef.current?.click()}>
          <ImageIcon size={14} />
        </ToolbarButton>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleInsertImage(e.target.files[0]); e.target.value = ''; }}
        />
        <div className="w-px h-5 bg-zinc-200 mx-1" />
        <ToolbarButton title="Hoàn tác" onClick={() => editor.chain().focus().undo().run()}>
          <Undo size={14} />
        </ToolbarButton>
        <ToolbarButton title="Làm lại" onClick={() => editor.chain().focus().redo().run()}>
          <Redo size={14} />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
