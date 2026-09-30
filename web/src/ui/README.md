# FairShare UI

A small, dependency-free component kit for the FairShare web app. It follows
Apple's interface guidelines (from WWDC's *Designing Fluid Interfaces* and
related talks), adapted for the web:

- feedback on pointer-down, not on release
- springs for anything a user can touch; animations can be interrupted
- translucent materials to show hierarchy
- `prefers-reduced-motion`, `prefers-reduced-transparency` and
  `prefers-contrast` are handled by the tokens and components

Import everything from the barrel. It also loads the design tokens:

```jsx
import { Button, TextField, Sheet, AsyncContent } from "../ui";
```

## Architecture

```text
src/ui/
├── index.js                # public API (the only supported import path)
├── styles/
│   ├── tokens.scss         # CSS custom properties + preference media queries
│   └── _mixins.scss        # button-reset, press-feedback, material, hover
├── motion/
│   ├── spring.js           # interruptible, velocity-preserving spring
│   ├── physics.js          # project(), rubberband(), VelocityTracker
│   ├── useSpring.js        # React binding (writes styles, no re-renders)
│   └── usePrefersReducedMotion.js
├── utils/                  # cx(), shared PropTypes
└── components/<Name>/      # Name.jsx + Name.scss + Name.test.jsx
```

The layers are:

1. **Tokens**: colour, type scale (tracking depends on size), spacing in `rem`,
   radii, materials, shadows and motion. Components never hard-code values.
   Theming and accessibility preferences are handled in one place.
2. **Motion**: plain JavaScript with no React dependency, unit-tested with a
   fake frame clock. Springs are configured the way Apple does it, with
   `damping` (1 means no overshoot) and `response` in seconds.
3. **Components**: each one has a single job and its own styles. The API is
   PropTypes-documented, `ref` is passed as a normal prop (React 19), and any
   extra props go to the underlying element.

Class names use the `fs-` prefix. The app shell does not impose global
`button`/`input` styles; components keep their own appearance wherever they
are placed.

## Components

| Component | Purpose | Key props |
| --- | --- | --- |
| `Button` | Text action | `variant` (primary, secondary, tinted, plain, destructive), `size`, `loading`, `iconStart`, `iconEnd`, `fullWidth` |
| `LinkButton` | Button-shaped React Router link (keeps link semantics) | `to`, `variant`, `size`, `iconStart`, `iconEnd`, `fullWidth` |
| `IconButton` | Icon-only action | `label` (required, used as the accessible name), `variant`, `size` |
| `TextField` | Labelled input | `label`, `hint`, `error`, `prefix`, `suffix`, `hideLabel`; other props go to `<input>` |
| `Switch` | On/off setting | `label`, `description`, `checked` + `onChange` or `defaultChecked`, `name` |
| `Card` | Surface | `as`, `material` (thin, regular, thick, solid), `padding`, `interactive` |
| `Sheet` | Modal bottom sheet | `open`, `onClose`, `title`, `description`, `footer`, `dismissible`, `initialFocusRef` |
| `AsyncContent` | Loading, error, empty and content states | `loading`, `error`, `isEmpty`, `onRetry`, `skeleton`, `empty`, `delay` |
| `Alert` | Inline feedback | `tone` (info, success, warning, error), `title`, `action`, `onDismiss` |
| `EmptyState` | Explains an empty view and the next step | `icon`, `title`, `description`, `actions`, `headingLevel` |
| `Skeleton` | Loading placeholder | `variant` (text, rect, circle), `lines`, `width`, `height` |
| `Spinner` | Activity indicator | `size`, `label` (an announced status if set, otherwise decorative) |
| `VisuallyHidden` | Content for screen readers only | `as` |

## Usage

### Buttons and loading state

```jsx
<Button onClick={save} loading={saving} loadingLabel="Saving">
  Save
</Button>

<Button variant="tinted" iconStart={<Plus />}>Add expense</Button>

<LinkButton to="/budget" variant="secondary">Plan Budget</LinkButton>

<IconButton label={`Remove ${expense.name}`} variant="destructive" size="sm" onClick={remove}>
  <X />
</IconButton>
```

While loading, the button keeps focus (`aria-disabled` rather than `disabled`),
ignores clicks and form submission, and keeps its width.

### Forms with inline validation

```jsx
const amountError = amount < 0 ? "Amount can’t be negative" : undefined;

<TextField
  label="Rent"
  type="number"
  inputMode="decimal"
  suffix="kr"
  hint="Monthly, shared by everyone"
  error={amountError}
  value={amount}
  onChange={(event) => setAmount(event.target.value)}
/>

<Switch
  label="Split equally"
  description="Ignore differences in income"
  checked={splitEqually}
  onChange={setSplitEqually}
/>
```

### Loading, error and empty states

```jsx
<AsyncContent
  loading={isLoading}
  error={loadError}
  onRetry={reload}
  isEmpty={expenses.length === 0}
  skeleton={<Skeleton variant="rect" lines={3} />}
  empty={
    <EmptyState
      icon={<Inbox />}
      title="No expenses yet"
      description="Add rent, groceries or anything you share."
      actions={<Button onClick={openAddSheet}>Add expense</Button>}
    />
  }
>
  {() => <ExpenseList expenses={expenses} />}
</AsyncContent>
```

The skeleton only appears after `delay` ms (150 by default), so fast
responses never flash a placeholder. Use `loading` for the first load only.
For background refreshes, keep showing the existing content.

### Bottom sheet

```jsx
const [open, setOpen] = useState(false);
const nameRef = useRef(null);

<Button onClick={() => setOpen(true)}>Add expense</Button>

<Sheet
  open={open}
  onClose={() => setOpen(false)}
  title="Add expense"
  description="Split according to income"
  initialFocusRef={nameRef}
  footer={<Button fullWidth onClick={submit}>Add</Button>}
>
  <TextField label="Name" ref={nameRef} />
</Sheet>
```

Dragging the header follows the finger 1:1. On release, the sheet uses
momentum projection to choose between dismissing and settling back, and passes
the release velocity on to the spring. The sheet can be grabbed mid-animation.
Opening it while it is closing reverses from its current on-screen position.
The sheet is a labelled `role="dialog"` with `aria-modal`. It traps focus,
closes on Escape, makes the background `inert`, locks scrolling and returns
focus to the trigger. With reduced motion enabled, opening and closing
cross-fade instead of sliding.

### Custom motion

```jsx
const ref = useRef(null);
const spring = useSpring(0, (x) => {
  ref.current.style.transform = `translateX(${x}px)`;
});

// Critically damped by default; use a bounce only after a flick.
spring.to(target, { damping: 0.8, response: 0.3, velocity: releaseVelocity });
```

## Best practices

- **Import from `src/ui`**, not from component files, so the tokens load. Use
  `LinkButton` for route changes and `Button` for actions; never navigate from a
  button's click handler just to obtain button styling.
- **Always label**: `IconButton` needs `label`, and `TextField` and `Switch`
  need `label` (use `hideLabel` to hide it visually).
- **Choose the semantic element**: `Card as="section"`, `as="li"` or
  `as="button"` (with `interactive`), not a `div` with `onClick`.
- **Use springs for gestures and CSS for state changes**: CSS transitions
  can't be interrupted smoothly partway through a gesture.
- **Default to `damping: 1`**. Add bounce (about 0.8) only when the user's
  gesture carried momentum.
- **Animate only `transform` and `opacity`**, writing to the element in the
  spring's `onUpdate` rather than setting React state every frame.
- **Handle every state**: loading, error with retry, empty with a next step,
  and content.
- **Keep the local-storage-first data pattern** in pages. The kit is purely
  presentational and never fetches data.
- **Test behaviour, not styling**: query by role and label, as the existing
  `*.test.jsx` files do.

## Site integration

`Home`, `Login`, `SignUp`, `CostCalculator`, `Budget` and the shared navigation
use these controls and tokens. Page-specific responsive layouts live in their
own stylesheets; `src/index.scss` contains only document and app-shell styles.
Links remain links (`LinkButton` for call-to-action styling); actions remain
buttons. Navigation uses `NavLink`/`aria-current` for wayfinding.

Budget data is stored **only on this device**, separately from the calculator's
local-first/API-synced incomes and expenses. Its monthly category limits and
transactions are not synced to an account. A new unsaved month can inherit
limits from the most recent earlier saved month, but spending never carries
forward; merely viewing a month does not save it. Signing out clears the local
budget along with local calculator data. This privacy/data-loss distinction
should be visible wherever a user manages their budget.
