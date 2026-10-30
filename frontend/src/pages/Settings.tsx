import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/config";
import { apiClient } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { Settings as SettingsIcon, Plus, Edit2, Trash2, Palette, Moon, Sun, Check } from "lucide-react";

interface Setting {
  id: number;
  name: string;
  value: string | null;
  createdAt: string;
  updatedAt: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [deletingSettingId, setDeletingSettingId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newSetting, setNewSetting] = useState({ name: '', value: '' });

  const {
    currentTheme,
    currentFont,
    isDarkMode,
    setTheme,
    setFont,
    setDarkMode,
    themePresets,
    fontOptions,
  } = useTheme();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.fetch(api.settings);

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data: Setting[] = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAdd = async () => {
    try {
      const response = await apiClient.fetch(api.settings, {
        method: "POST",
        body: JSON.stringify({
          name: newSetting.name,
          value: newSetting.value || null
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to add setting');
      }

      setNewSetting({ name: '', value: '' });
      setIsAddDialogOpen(false);
      fetchSettings();
    } catch (error) {
      console.error('Error adding setting:', error);
      alert('Failed to add setting: ' + error);
    }
  };

  const handleUpdate = async () => {
    if (!editingSetting) return;

    try {
      const response = await apiClient.fetch(`${api.settings}/${editingSetting.id}`, {
        method: "PUT",
        body: JSON.stringify({
          id: editingSetting.id,
          name: editingSetting.name,
          value: editingSetting.value || null
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update setting');
      }

      setEditingSetting(null);
      setIsEditDialogOpen(false);
      fetchSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Failed to update setting: ' + error);
    }
  };

  const handleDelete = async (settingId: number) => {
    try {
      const response = await apiClient.fetch(`${api.settings}/${settingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error('Failed to delete setting');
      }

      fetchSettings();
      setDeletingSettingId(null);
    } catch (error) {
      console.error('Error deleting setting:', error);
      alert('Failed to delete setting.');
      setDeletingSettingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of your application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Switch
                checked={isDarkMode}
                onCheckedChange={setDarkMode}
              />
              <Moon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Color Scheme */}
          <div className="space-y-3">
            <div className="space-y-0.5">
              <Label className="text-base">Color Scheme</Label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred accent color
              </p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {themePresets.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    currentTheme.id === theme.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full shadow-sm"
                    style={{ backgroundColor: theme.preview }}
                  />
                  <span className="text-xs font-medium text-center leading-tight">
                    {theme.name}
                  </span>
                  {currentTheme.id === theme.id && (
                    <div className="absolute top-1 right-1">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Font Family</Label>
              <p className="text-sm text-muted-foreground">
                Select your preferred font style
              </p>
            </div>
            <Select value={currentFont.id} onValueChange={setFont}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((font) => (
                  <SelectItem key={font.id} value={font.id}>
                    <span style={{ fontFamily: font.value }}>{font.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Application Settings Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Application Settings
            </CardTitle>
            <CardDescription className="mt-1.5">
              Manage your application configuration settings.
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Setting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Setting</DialogTitle>
                <DialogDescription>
                  Create a new application setting with a name and value.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newSetting.name}
                    onChange={(e) => setNewSetting({ ...newSetting, name: e.target.value })}
                    placeholder="Setting name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    value={newSetting.value}
                    onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                    placeholder="Setting value"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={!newSetting.name.trim()}>
                  Add Setting
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground py-8 text-center">Loading settings...</div>
          ) : settings.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              No settings found. Add your first setting to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">{setting.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {setting.value || <span className="text-muted-foreground italic">No value</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(setting.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(setting.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSetting(setting);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingSettingId(setting.id)}
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) setEditingSetting(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Setting</DialogTitle>
            <DialogDescription>
              Update the setting name and value.
            </DialogDescription>
          </DialogHeader>
          {editingSetting && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingSetting.name}
                  onChange={(e) => setEditingSetting({ ...editingSetting, name: e.target.value })}
                  placeholder="Setting name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-value">Value</Label>
                <Input
                  id="edit-value"
                  value={editingSetting.value || ''}
                  onChange={(e) => setEditingSetting({ ...editingSetting, value: e.target.value })}
                  placeholder="Setting value"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingSetting(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!editingSetting?.name.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingSettingId}
        onOpenChange={(open) => !open && setDeletingSettingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this setting. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSettingId && handleDelete(deletingSettingId)}
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

export default Settings;
