import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { NodeSelection } from 'prosemirror-state';
import { useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, LinkIcon, ImageIcon, Undo, Redo, Trash2 } from 'lucide-react';
import { uploadImage } from '../../api/admin.api';
import toast from 'react-hot-toast';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const serverOrigin = baseUrl.replace(/\/api\/?$/, '');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }),
      Image,
      Placeholder.configure({ placeholder: 'Soạn nội dung bài viết ở đây...' })
    ],
    content: value ? value.replace(/src="\/uploads\//g, `src="${serverOrigin}/uploads/`) : '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Remove server origin so database stores clean relative paths
      const cleanHtml = html.replace(new RegExp(serverOrigin, 'g'), '');
      onChange(cleanHtml);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[320px] px-4 py-3'
      },
      handleClickOn(view, _pos, node, nodePos, _event, _direct) {
        if (node.type.name === 'image') {
          const selection = NodeSelection.create(view.state.doc, nodePos);
          view.dispatch(view.state.tr.setSelection(selection));
          return true;
        }
        return false;
      }
    }
  });

  if (!editor) return null;

  const handleInsertImage = async (file: File) => {
    try {
      const res = await uploadImage(file, 'blog');
      const absoluteUrl = `${serverOrigin}${res.data.url}`;
      editor.chain().focus().setImage({ src: absoluteUrl }).run();
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
      <style>{`
        .ProseMirror img {
          transition: all 0.2s ease-in-out;
          cursor: pointer;
          border-radius: 8px;
        }
        .ProseMirror img.ProseMirror-selectednode {
          outline: 3px solid #0D9488;
          box-shadow: 0 0 0 6px rgba(13, 148, 136, 0.15);
          transform: scale(0.99);
        }
      `}</style>
      <div className="sticky top-0 z-10 flex items-center gap-1 px-2 py-2 border-b border-zinc-100 bg-slate-50/95 backdrop-blur-md flex-wrap shadow-sm">
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
        {editor.isActive('image') && (
          <ToolbarButton title="Xóa ảnh đang chọn" onClick={() => editor.chain().focus().deleteSelection().run()}>
            <Trash2 size={14} className="text-rose-500 animate-pulse" />
          </ToolbarButton>
        )}
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
