[Ver001.000]

# TENET UI Components

## Usage

### Button
```tsx
import { Button } from '@/components/TENET';

<Button variant="solid" size="md" onClick={handleClick}>
  Click Me
</Button>
```

### Input
```tsx
import { Input } from '@/components/TENET';

<Input 
  placeholder="Enter text"
  leftElement={<Icon />}
/>
```

## Design Tokens

See `design-system/tokens.json`

## Components

| Category | Components |
|----------|------------|
| Primitives | Button, Input, Checkbox, Radio, Switch, Select, Textarea, Slider, DatePicker, FileUpload, ColorPicker |
| Composite | Card, Modal, Accordion, Tabs, Breadcrumb, Pagination, Dropdown, Tooltip, Popover, Drawer |
| Layout | Box, Stack, Grid, Flex, Container, Spacer, Divider, AspectRatio, Center, SimpleGrid |
| Feedback | Toast, Alert, Progress, CircularProgress, Skeleton, Spinner, Badge, Avatar, Rating |
