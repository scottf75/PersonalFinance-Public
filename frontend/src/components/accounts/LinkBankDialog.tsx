import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Link2, Building2, Loader2, Plus } from "lucide-react";
import { useTellerConnect } from "@/hooks/use-teller-connect";

interface Account {
  id: number;
  name: string;
  institution: string;
}

interface TellerAccount {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  institution: {
    name: string;
  };
  lastFour?: string;
}

interface LinkBankDialogProps {
  account: Account;
  onAccountLinked?: () => void;
}

const LinkBankDialog = ({ account, onAccountLinked }: LinkBankDialogProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"choose" | "connect" | "link" | "success">("choose");
  const [selectedTellerAccount, setSelectedTellerAccount] = useState<string>("");

  const {
    openTellerConnect,
    isLoading,
    error,
    enrollment,
    tellerAccounts,
    existingEnrollments,
    fetchExistingEnrollments,
    selectExistingEnrollment,
    linkAccountToTeller,
  } = useTellerConnect(() => {
    setStep("link");
  });

  // Fetch existing enrollments when dialog opens
  useEffect(() => {
    if (open) {
      fetchExistingEnrollments();
    }
  }, [open, fetchExistingEnrollments]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state when closing
      setStep("choose");
      setSelectedTellerAccount("");
    }
  };

  const handleConnectNewBank = () => {
    setStep("connect");
  };

  const handleUseExistingEnrollment = async (enrollmentId: number) => {
    const existing = existingEnrollments.find(e => e.id === enrollmentId);
    if (existing) {
      await selectExistingEnrollment(existing);
    }
  };

  const handleConnectBank = () => {
    openTellerConnect();
  };

  const handleLinkAccount = async () => {
    if (!selectedTellerAccount || !enrollment) {
      toast.error("Please select a bank account to link");
      return;
    }

    const success = await linkAccountToTeller(
      account.id,
      selectedTellerAccount,
      enrollment.id
    );

    if (success) {
      toast.success(`${account.name} linked successfully!`);
      setStep("success");
      onAccountLinked?.();
    }
  };

  const getTellerAccountLabel = (tellerAcc: TellerAccount) => {
    const lastFour = tellerAcc.lastFour ? ` (...${tellerAcc.lastFour})` : "";
    return `${tellerAcc.name}${lastFour} - ${tellerAcc.institution.name}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Link to bank">
          <Link2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Link {account.name}
          </DialogTitle>
          <DialogDescription>
            {step === "choose" &&
              "Choose a connected bank or connect a new one."}
            {step === "connect" &&
              "Connect your bank to import transactions automatically."}
            {step === "link" &&
              "Select which bank account to link."}
            {step === "success" &&
              "Your account has been linked successfully!"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {step === "choose" && (
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium">Linking:</p>
              <p className="text-sm text-muted-foreground">
                {account.name} - {account.institution}
              </p>
            </div>

            {existingEnrollments.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Use an existing bank connection
                </label>
                <div className="space-y-2">
                  {existingEnrollments.map((existing) => (
                    <Button
                      key={existing.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleUseExistingEnrollment(existing.id!)}
                      disabled={isLoading}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      {existing.institutionName || "Unknown Bank"}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              {existingEnrollments.length > 0 && (
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
              )}
              {existingEnrollments.length > 0 && (
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              )}
            </div>

            <Button
              variant={existingEnrollments.length > 0 ? "outline" : "default"}
              className="w-full"
              onClick={handleConnectNewBank}
              disabled={isLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Connect a New Bank
            </Button>
          </div>
        )}

        {step === "connect" && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to securely connect your bank using
              Teller. Your credentials are never stored on our servers.
            </p>
            <div className="flex justify-center">
              <Button
                onClick={handleConnectBank}
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 h-4 w-4" />
                    Connect Bank
                  </>
                )}
              </Button>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("choose")}
              >
                Back
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "link" && (
          <div className="space-y-4 py-4">
            {enrollment && (
              <p className="text-sm text-muted-foreground">
                Connected to: <strong>{enrollment.institutionName}</strong>
              </p>
            )}

            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium">Linking to:</p>
              <p className="text-sm text-muted-foreground">
                {account.name} - {account.institution}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Bank Account
              </label>
              <Select
                value={selectedTellerAccount}
                onValueChange={setSelectedTellerAccount}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {tellerAccounts.map((tellerAcc) => (
                    <SelectItem key={tellerAcc.id} value={tellerAcc.id}>
                      {getTellerAccountLabel(tellerAcc)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tellerAccounts.length === 0 && !isLoading && (
                <p className="text-sm text-muted-foreground">
                  No accounts available from this bank connection.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("choose")}
              >
                Back
              </Button>
              <Button
                onClick={handleLinkAccount}
                disabled={isLoading || !selectedTellerAccount}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Linking...
                  </>
                ) : (
                  "Link Account"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="rounded-full bg-green-100 p-3">
                <Link2 className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {account.name} is now linked. Click "Sync" to import transactions.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LinkBankDialog;
