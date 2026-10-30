import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/config";
import { apiClient } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Folder, Tag, TrendingUp, ShoppingCart, Home, Car, Heart, Gamepad2, GraduationCap, Utensils, Edit2, Trash2, Power } from "lucide-react";
import AddCategoryDialog from "@/components/categories/AddCategoryDialog";
import EditCategoryDialog from "@/components/categories/EditCategoryDialog";

interface Category {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    icon?: string;
    categoryType: number; // 1 = Income, 2 = Expense
}

const Categories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
    const [showInactive, setShowInactive] = useState(false);

    // Icon mapping for categories
    const getCategoryIcon = (categoryName: string) => {
        const name = categoryName.toLowerCase();
        if (name.includes('food') || name.includes('dining') || name.includes('restaurant')) 
            return <Utensils className="h-6 w-6" />;
        if (name.includes('transport') || name.includes('car') || name.includes('fuel')) 
            return <Car className="h-6 w-6" />;
        if (name.includes('shop') || name.includes('retail') || name.includes('groceries')) 
            return <ShoppingCart className="h-6 w-6" />;
        if (name.includes('home') || name.includes('rent') || name.includes('mortgage')) 
            return <Home className="h-6 w-6" />;
        if (name.includes('health') || name.includes('medical') || name.includes('fitness')) 
            return <Heart className="h-6 w-6" />;
        if (name.includes('education') || name.includes('school') || name.includes('course')) 
            return <GraduationCap className="h-6 w-6" />;
        if (name.includes('entertainment') || name.includes('game') || name.includes('fun')) 
            return <Gamepad2 className="h-6 w-6" />;
        if (name.includes('investment') || name.includes('saving')) 
            return <TrendingUp className="h-6 w-6" />;
        return <Tag className="h-6 w-6" />; // Default icon
    };

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await apiClient.fetch(api.categories);

            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }

            const data: Category[] = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            // For now, use sample data if API fails
            setCategories([
                { id: 1, name: "Salary", description: "Monthly salary income", isActive: true, categoryType: 1 },
                { id: 2, name: "Groceries", description: "Food and household items", isActive: true, categoryType: 2 },
                { id: 3, name: "Transportation", description: "Car, fuel, public transport", isActive: true, categoryType: 2 },
                { id: 4, name: "Entertainment", description: "Movies, games, subscriptions", isActive: true, categoryType: 2 },
                { id: 5, name: "Healthcare", description: "Medical expenses and insurance", isActive: true, categoryType: 2 },
                { id: 6, name: "Education", description: "Courses, books, training", isActive: false, categoryType: 2 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDelete = async (categoryId: number) => {
        try {
            const response = await apiClient.fetch(`${api.categories}/${categoryId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error('Failed to delete category');
            }

            fetchCategories();
            setDeletingCategoryId(null);
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Failed to delete category. It may be in use by transactions.');
            setDeletingCategoryId(null);
        }
    };

    const handleToggleActive = async (categoryId: number) => {
        try {
            const response = await apiClient.fetch(`${api.categories}/${categoryId}/toggle-active`, {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error('Failed to toggle category status');
            }

            fetchCategories();
        } catch (error) {
            console.error('Error toggling category status:', error);
            alert('Failed to toggle category status.');
        }
    };

    // Filter categories based on showInactive state
    const filteredCategories = showInactive
        ? categories
        : categories.filter(c => c.isActive);

    // Group categories by type
    const incomeCategories = filteredCategories.filter(c => c.categoryType === 1);
    const expenseCategories = filteredCategories.filter(c => c.categoryType === 2 || !c.categoryType);

    return (
        <div className="space-y-6">
            {/* Header with consistent styling */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="show-inactive"
                            checked={showInactive}
                            onCheckedChange={setShowInactive}
                        />
                        <Label htmlFor="show-inactive">Show Inactive</Label>
                    </div>
                    <AddCategoryDialog onCategoryAdded={fetchCategories} />
                </div>
            </div>

            {/* Loading state */}
            {loading ? (
                <div className="text-muted-foreground">Loading categories...</div>
            ) : (
                <div className="space-y-6">
                    {/* Income Categories Section */}
                    {incomeCategories.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-green-600 mb-3 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Income Categories ({incomeCategories.length})
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {incomeCategories.map((category) => (
                                    <Card key={category.id} className={`hover:shadow-lg transition-shadow border-l-4 border-l-green-500 ${!category.isActive ? 'opacity-60' : ''}`}>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <div className="flex items-center space-x-2">
                                                <div className="rounded-full bg-muted p-2 flex items-center justify-center">
                                                    {category.icon ? (
                                                        <span className="text-2xl">{category.icon}</span>
                                                    ) : (
                                                        getCategoryIcon(category.name)
                                                    )}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{category.name}</CardTitle>
                                                    <CardDescription className="mt-1">
                                                        {category.description}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-2">
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                                        Income
                                                    </Badge>
                                                    <Badge variant={category.isActive ? "default" : "secondary"}>
                                                        {category.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleToggleActive(category.id)}
                                                        title={category.isActive ? "Deactivate category" : "Activate category"}
                                                    >
                                                        <Power className={`h-4 w-4 ${category.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setEditingCategory(category)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDeletingCategoryId(category.id)}
                                                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Expense Categories Section */}
                    {expenseCategories.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Expense Categories ({expenseCategories.length})
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {expenseCategories.map((category) => (
                                    <Card key={category.id} className={`hover:shadow-lg transition-shadow border-l-4 border-l-red-500 ${!category.isActive ? 'opacity-60' : ''}`}>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <div className="flex items-center space-x-2">
                                                <div className="rounded-full bg-muted p-2 flex items-center justify-center">
                                                    {category.icon ? (
                                                        <span className="text-2xl">{category.icon}</span>
                                                    ) : (
                                                        getCategoryIcon(category.name)
                                                    )}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{category.name}</CardTitle>
                                                    <CardDescription className="mt-1">
                                                        {category.description}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-2">
                                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                                                        Expense
                                                    </Badge>
                                                    <Badge variant={category.isActive ? "default" : "secondary"}>
                                                        {category.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleToggleActive(category.id)}
                                                        title={category.isActive ? "Deactivate category" : "Activate category"}
                                                    >
                                                        <Power className={`h-4 w-4 ${category.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setEditingCategory(category)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDeletingCategoryId(category.id)}
                                                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state */}
            {!loading && filteredCategories.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-center">
                            No categories found. Add your first category to get started.
                        </p>
                        <Button className="mt-4">
                            <Folder className="mr-2 h-4 w-4" />
                            Add Category
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Edit Category Dialog */}
            {editingCategory && (
                <EditCategoryDialog
                    category={editingCategory}
                    open={!!editingCategory}
                    onOpenChange={(open) => !open && setEditingCategory(null)}
                    onCategoryUpdated={fetchCategories}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog 
                open={!!deletingCategoryId} 
                onOpenChange={(open) => !open && setDeletingCategoryId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this category. Any transactions using this category will need to be updated.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingCategoryId && handleDelete(deletingCategoryId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Categories;