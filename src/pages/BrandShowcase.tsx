import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrafficLightCard } from "@/components/ui/traffic-light-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react"

/**
 * TCMS Brand Identity Showcase
 * 
 * This component demonstrates all brand-compliant UI components.
 * Reference: docs/BRAND_IDENTITY_SYSTEM.md
 */
export default function BrandShowcase() {
  return (
    <div className="container mx-auto p-8 space-y-12 max-w-7xl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-h1">TCMS Brand Identity Showcase</h1>
        <p className="text-slate-500 text-body">
          Comprehensive demonstration of brand-compliant UI components
        </p>
      </div>

      {/* Color Palette */}
      <section className="space-y-4">
        <h2 className="text-h2">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="w-full h-24 bg-tcms-blue rounded-lg"></div>
            <p className="text-sm font-medium">TCMS Blue</p>
            <p className="text-xs text-slate-500">#0066FF</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-24 bg-emerald-500 rounded-lg"></div>
            <p className="text-sm font-medium">Valid/Success</p>
            <p className="text-xs text-slate-500">#10B981</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-24 bg-amber-500 rounded-lg"></div>
            <p className="text-sm font-medium">Expiring/Warning</p>
            <p className="text-xs text-slate-500">#F59E0B</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-24 bg-red-500 rounded-lg"></div>
            <p className="text-sm font-medium">Expired/Error</p>
            <p className="text-xs text-slate-500">#EF4444</p>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-4">
        <h2 className="text-h2">Typography Scale</h2>
        <div className="space-y-3">
          <h1 className="text-h1">Heading 1 - 36px Bold</h1>
          <h2 className="text-h2">Heading 2 - 30px Bold</h2>
          <h3 className="text-h3">Heading 3 - 24px Bold</h3>
          <h4 className="text-h4">Heading 4 - 20px Semibold</h4>
          <h5 className="text-h5">Heading 5 - 16px Semibold</h5>
          <p className="text-body">Body Text - 16px Regular (Line height 1.6)</p>
          <p className="text-small">Small Text - 14px Regular</p>
          <p className="text-micro">Micro Text - 12px Regular</p>
        </div>
      </section>

      {/* Traffic Light Dashboard */}
      <section className="space-y-4">
        <h2 className="text-h2">Traffic Light Dashboard</h2>
        <p className="text-slate-500">
          Purpose-built cards for competence status visualization
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TrafficLightCard
            status="valid"
            value={247}
            label="Valid Competences"
            onClick={() => console.log("Filter: Valid")}
          />
          <TrafficLightCard
            status="expiring"
            value={12}
            label="Expiring Soon"
            onClick={() => console.log("Filter: Expiring")}
          />
          <TrafficLightCard
            status="expired"
            value={3}
            label="Expired"
            onClick={() => console.log("Filter: Expired")}
          />
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-h2">Buttons</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-h4 mb-3">Primary Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="link">Link Button</Button>
            </div>
          </div>

          <div>
            <h3 className="text-h4 mb-3">Status Actions (Use Sparingly)</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="success">
                <CheckCircle className="mr-2" />
                Approve
              </Button>
              <Button variant="warning">
                <AlertTriangle className="mr-2" />
                Review
              </Button>
              <Button variant="danger">
                <XCircle className="mr-2" />
                Reject
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-h4 mb-3">Sizes</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <CheckCircle />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-h4 mb-3">States</h3>
            <div className="flex flex-wrap gap-3">
              <Button>Normal</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-h2">Badges</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-h4 mb-3">Traffic Light Status Badges</h3>
            <div className="flex flex-wrap gap-3">
              <Badge variant="valid" showIcon>Valid</Badge>
              <Badge variant="expiring" showIcon>Expiring Soon</Badge>
              <Badge variant="expired" showIcon>Expired</Badge>
              <Badge variant="pending" showIcon>Pending</Badge>
            </div>
          </div>

          <div>
            <h3 className="text-h4 mb-3">Standard Badges</h3>
            <div className="flex flex-wrap gap-3">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Alerts */}
      <section className="space-y-4">
        <h2 className="text-h2">Alerts</h2>
        
        <div className="space-y-4">
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Your competence records have been updated successfully.
            </AlertDescription>
          </Alert>

          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              12 competences are expiring within the next 30 days. Take action soon.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              3 competences have expired and require immediate attention.
            </AlertDescription>
          </Alert>

          <Alert variant="info">
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              System maintenance is scheduled for tomorrow at 2:00 AM UTC.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <h2 className="text-h2">Cards</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>
                Card description with supporting information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">
                Card content goes here. Cards use proper brand colors and spacing.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-tcms-blue">
            <CardHeader>
              <CardTitle>Accented Card</CardTitle>
              <CardDescription>
                With brand blue accent border
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">
                Use accent borders to highlight important information.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Form Elements */}
      <section className="space-y-4">
        <h2 className="text-h2">Form Elements</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Sample Form</CardTitle>
            <CardDescription>
              All form elements follow brand styling guidelines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Enter your full name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flight">Flight Operations</SelectItem>
                  <SelectItem value="cabin">Cabin Crew</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="ground">Ground Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Add any additional notes..."
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="default">Submit</Button>
              <Button variant="secondary">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Spacing System */}
      <section className="space-y-4">
        <h2 className="text-h2">Spacing System</h2>
        <p className="text-slate-500">4px base unit system</p>
        
        <div className="space-y-2">
          {[
            { name: 'XS', value: '4px', class: 'w-1' },
            { name: 'SM', value: '8px', class: 'w-2' },
            { name: 'MD', value: '12px', class: 'w-3' },
            { name: 'LG', value: '16px', class: 'w-4' },
            { name: 'XL', value: '24px', class: 'w-6' },
            { name: '2XL', value: '32px', class: 'w-8' },
            { name: '3XL', value: '48px', class: 'w-12' },
          ].map(space => (
            <div key={space.name} className="flex items-center gap-4">
              <div className="w-12 text-sm font-medium">{space.name}</div>
              <div className={`${space.class} h-8 bg-tcms-blue rounded`}></div>
              <div className="text-sm text-slate-500">{space.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-slate-200">
        <p className="text-sm text-slate-500">
          TCMS Brand Identity System v1.0 • Last Updated: January 15, 2026
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Reference: <code className="bg-slate-100 px-2 py-1 rounded">docs/BRAND_IDENTITY_SYSTEM.md</code>
        </p>
      </footer>
    </div>
  )
}
