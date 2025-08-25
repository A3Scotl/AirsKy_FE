import { Helmet } from "react-helmet-async";
import CategoryTable from "@/components/admin/categories/category-table";

const CategoryPage = () => {
  return (
    <div className="space-y-6">
      {/* Main Content */}
      <CategoryTable />
    </div>
  );
};

export default CategoryPage;
