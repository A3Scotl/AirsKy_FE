import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExportModal from "@/components/common/export-modal";
import { getEntityExportConfig } from "@/utils/export-config";

/**
 * Component helper để thêm nút export vào các trang admin
 * @param {Object} props
 * @param {string} props.entity - Tên entity (blogs, users, flights, etc.)
 * @param {string} props.variant - Variant của button (default, outline, etc.)
 * @param {string} props.size - Size của button (default, sm, lg, etc.)
 * @param {string} props.className - Class name bổ sung
 */
const ExportButton = ({
  entity,
  variant = "outline",
  size = "default",
  className = "",
}) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const exportConfig = getEntityExportConfig(entity);

  if (!exportConfig) {
    console.warn(`Export config not found for entity: ${entity}`);
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsExportModalOpen(true)}
        className={className}
      >
        <Download className="h-4 w-4 mr-2" />
        Xuất file
      </Button>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        entity={entity}
        entityDisplayName={exportConfig.displayName}
        availableFields={exportConfig.fields}
      />
    </>
  );
};

export default ExportButton;
