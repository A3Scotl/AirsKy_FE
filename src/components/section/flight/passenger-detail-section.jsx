import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Custom date formatting function to replace date-fns
const formatDate = (date, formatString) => {
  if (!date) return "";

  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();

  switch (formatString) {
    case "PPP":
      return d.toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    case "dd/MM/yyyy":
      return `${day}/${month}/${year}`;
    default:
      return d.toLocaleDateString("vi-VN");
  }
};

const PassengerDetails = ({ formData, updateFormData, updatePassenger }) => (
  <div>
    <h2 className="text-xl font-bold mb-4">Passenger Information</h2>
    <p className="text-sm text-gray-500 mb-6">
      Please provide the required information for all passengers
    </p>

    {/* Contact Person */}
    <div className="mb-8 border-2 border-gray-200 p-4 rounded-lg bg-gray-50">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 text-sm">👤</span>
        </div>
        <h3 className="font-semibold">Contact Person</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contact-fullname">Full Name *</Label>
          <Input
            id="contact-fullname"
            placeholder="Enter your full name"
            value={formData.contact.fullName}
            onChange={(e) =>
              updateFormData("contact", "fullName", e.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="contact-phone">Phone Number *</Label>
          <Input
            id="contact-phone"
            placeholder="Enter phone number"
            value={formData.contact.phone}
            onChange={(e) => updateFormData("contact", "phone", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="contact-email">Email Address *</Label>
          <Input
            id="contact-email"
            placeholder="Enter your email address"
            value={formData.contact.email}
            onChange={(e) => updateFormData("contact", "email", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="contact-confirm-email">Confirm Email *</Label>
          <Input
            id="contact-confirm-email"
            placeholder="Confirm your email address"
            value={formData.contact.confirmEmail}
            onChange={(e) =>
              updateFormData("contact", "confirmEmail", e.target.value)
            }
          />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <Checkbox
          id="is-passenger"
          checked={formData.contact.isPassenger}
          onCheckedChange={(checked) =>
            updateFormData("contact", "isPassenger", checked)
          }
        />
        <Label htmlFor="is-passenger">I am one of the passengers.</Label>
      </div>
    </div>

    {/* Passenger 1: Adult */}
    <div className="mb-8 border-2 border-gray-200 p-4 rounded-lg bg-gray-50">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-green-600 text-sm">👤</span>
        </div>
        <h3 className="font-semibold">Passenger 1: Adult</h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="p1-fullname">Full Name *</Label>
          <Input
            id="p1-fullname"
            placeholder="As on passport/ID"
            value={formData.passengers[0].fullName}
            onChange={(e) => updatePassenger(0, "fullName", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="p1-gender">Gender *</Label>
          <Select
            value={formData.passengers[0].gender}
            onValueChange={(value) => updatePassenger(0, "gender", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="p1-dob">Date of Birth *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.passengers[0].dob && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.passengers[0].dob ? (
                  formatDate(formData.passengers[0].dob, "dd/MM/yyyy")
                ) : (
                  <span>dd/mm/yyyy</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.passengers[0].dob}
                onSelect={(date) => updatePassenger(0, "dob", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="col-span-2">
          <Label htmlFor="p1-passport">Passport Number (Optional)</Label>
          <Input
            id="p1-passport"
            placeholder="Enter passport number"
            value={formData.passengers[0].passport}
            onChange={(e) => updatePassenger(0, "passport", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="p1-ffn">Frequent Flyer Number (Optional)</Label>
          <Input
            id="p1-ffn"
            placeholder="Enter frequent flyer number"
            value={formData.passengers[0].frequentFlyer}
            onChange={(e) =>
              updatePassenger(0, "frequentFlyer", e.target.value)
            }
          />
        </div>
      </div>
    </div>
  </div>
);

export default PassengerDetails;
