import { useState, useEffect, useRef } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import "./ckeditor-theme.css";

const RichTextEditor = ({
  label,
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  error,
  className,
  required = false,
  ...props
}) => {
  const [isReady, setIsReady] = useState(false);
  const editorRef = useRef(null);

  const editorConfig = {
    toolbar: [
      "heading",
      "|",
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "|",
      "bulletedList",
      "numberedList",
      "|",
      "outdent",
      "indent",
      "|",
      "blockQuote",
      "insertTable",
      "|",
      "link",
      "imageInsert",
      "|",
      "undo",
      "redo",
      "|",
      "alignment",
      "fontColor",
      "fontBackgroundColor",
      "|",
      "code",
      "codeBlock",
      "|",
      "horizontalLine",
      "pageBreak",
    ],
    placeholder: placeholder,
    image: {
      toolbar: [
        "imageStyle:inline",
        "imageStyle:block",
        "imageStyle:side",
        "|",
        "toggleImageCaption",
        "imageTextAlternative",
      ],
    },
    table: {
      contentToolbar: [
        "tableColumn",
        "tableRow",
        "mergeTableCells",
        "tableCellProperties",
        "tableProperties",
      ],
    },
    link: {
      decorators: {
        openInNewTab: {
          mode: "manual",
          label: "Mở trong tab mới",
          defaultValue: true,
          attributes: {
            target: "_blank",
            rel: "noopener noreferrer",
          },
        },
      },
    },
    heading: {
      options: [
        {
          model: "paragraph",
          title: "Paragraph",
          class: "ck-heading_paragraph",
        },
        {
          model: "heading1",
          view: "h1",
          title: "Heading 1",
          class: "ck-heading_heading1",
        },
        {
          model: "heading2",
          view: "h2",
          title: "Heading 2",
          class: "ck-heading_heading2",
        },
        {
          model: "heading3",
          view: "h3",
          title: "Heading 3",
          class: "ck-heading_heading3",
        },
        {
          model: "heading4",
          view: "h4",
          title: "Heading 4",
          class: "ck-heading_heading4",
        },
      ],
    },
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor="rich-text-editor">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <div
        className={cn(
          "min-h-[300px] border rounded-md overflow-hidden",
          error ? "border-destructive" : "border-input",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        )}
      >
        <CKEditor
          editor={ClassicEditor}
          config={editorConfig}
          data={value || ""}
          onReady={(editor) => {
            editorRef.current = editor;
            setIsReady(true);

            // Custom styling for the editor
            const editorElement = editor.ui.view.editable.element;
            if (editorElement) {
              editorElement.style.minHeight = "250px";
              editorElement.style.padding = "16px";
              editorElement.style.fontSize = "14px";
              editorElement.style.lineHeight = "1.5";
            }
          }}
          onChange={(event, editor) => {
            const data = editor.getData();
            onChange?.(data);
          }}
          onError={(error, { willEditorRestart }) => {
            console.error("CKEditor error:", error);
            if (willEditorRestart) {
              editorRef.current = null;
            }
          }}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Sử dụng thanh công cụ để định dạng nội dung. Hỗ trợ văn bản phong phú,
        hình ảnh, bảng và liên kết.
      </p>
    </div>
  );
};

export default RichTextEditor;
