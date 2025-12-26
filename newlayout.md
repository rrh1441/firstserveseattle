# Landing Page Styling Improvements

## Summary
Focus on spacing, typography, CTA prominence, and social proof. No hero images needed - minimalist approach is correct.

---

## 1. InteractiveCTA.tsx (Button Styling)

**Current (line 48):**
```tsx
className={`w-full md:w-auto md:px-8 bg-[#0c372b] text-white py-4 px-6 ${sizeClasses} rounded hover:bg-[#0a2e21] transition-colors disabled:opacity-50 ${className}`}
```

**Updated:**
```tsx
className={`w-full md:w-auto md:px-10 bg-[#0c372b] text-white py-4 px-6 ${sizeClasses} rounded-xl shadow-lg hover:bg-[#0a2e21] hover:shadow-xl transition-all disabled:opacity-50 ${className}`}
```

**Changes:**
- `rounded` → `rounded-xl` (more modern)
- Added `shadow-lg` and `hover:shadow-xl` for depth
- `md:px-8` → `md:px-10` (slightly wider)
- `transition-colors` → `transition-all` (animate shadow too)

---

## 2. StaticLandingPage.tsx (Main Landing Page)

### Hero Section
**Current:**
```tsx
<section className="pt-8 pb-6 text-center md:pt-12 md:pb-8">
  <h1 className="text-5xl font-bold text-gray-900 mb-6 md:text-7xl md:mb-8 leading-none">
```

**Updated:**
```tsx
<section className="pt-12 pb-10 text-center md:pt-20 md:pb-16">
  <h1 className="text-5xl font-bold text-gray-900 mb-6 md:text-7xl md:mb-8 leading-none tracking-tight">
```

### Hero Subtitle
**Current:**
```tsx
<p className="text-xl mb-8 md:text-2xl md:mb-10 max-w-2xl mx-auto text-gray-700">
```

**Updated:**
```tsx
<p className="text-xl mb-8 md:text-2xl md:mb-10 max-w-2xl mx-auto text-gray-600 leading-relaxed">
```

### Social Proof (below CTA)
**Current:**
```tsx
<p className="text-lg text-gray-500 mt-3 text-center md:text-base">No credit card needed • 2,500+ local players use us monthly</p>
```

**Updated:**
```tsx
<div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-sm md:text-base text-gray-500">
  <span>No credit card needed</span>
  <span className="hidden sm:inline text-gray-300">|</span>
  <span className="font-medium text-gray-700">2,500+ players check courts monthly</span>
</div>
```

### "Stop wasting time" Section
**Current:**
```tsx
<section className="py-6 md:py-8">
  <h2 className="text-3xl font-semibold text-gray-900 mb-6 text-center md:text-4xl md:mb-8">Stop wasting time</h2>
```

**Updated:**
```tsx
<section className="py-10 md:py-16">
  <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center md:text-4xl md:mb-10">Stop wasting time</h2>
```

### "What you get" Section
**Current:**
```tsx
<section className="py-6 border-t border-gray-100 md:py-8">
  <h2 className="text-3xl font-semibold text-gray-900 mb-6 text-center md:text-4xl md:mb-8">What you get</h2>
```

**Updated:**
```tsx
<section className="py-10 border-t border-gray-100 md:py-16">
  <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center md:text-4xl md:mb-10">What you get</h2>
```

### Testimonial Section
**Current:**
```tsx
<section className="py-6 border-t border-gray-100 md:py-8">
  <blockquote className="text-gray-700 text-center max-w-sm mx-auto md:max-w-2xl">
    <p className="mb-2 md:text-lg">&quot;Used to waste 30 minutes driving between courts. Now I know exactly where to go.&quot;</p>
    <cite className="text-sm text-gray-600 not-italic md:text-base">— Mike R., Capitol Hill</cite>
  </blockquote>
</section>
```

**Updated:**
```tsx
<section className="py-12 border-t border-gray-100 md:py-20 bg-gray-50 -mx-4 px-4 md:-mx-8 md:px-8">
  <blockquote className="text-center max-w-xl mx-auto">
    <p className="text-xl md:text-2xl text-gray-700 mb-4 leading-relaxed">&quot;Used to waste 30 minutes driving between courts. Now I know exactly where to go.&quot;</p>
    <cite className="text-base text-gray-600 not-italic font-medium">— Mike R., Capitol Hill</cite>
  </blockquote>
  <p className="text-center text-sm text-gray-500 mt-6">Join 15,000+ Seattle players who use First Serve</p>
</section>
```

### Bottom CTA Section
**Current:**
```tsx
<section className="py-6 md:py-8 flex flex-col items-center">
```

**Updated:**
```tsx
<section className="py-12 md:py-20 flex flex-col items-center">
```

### Footer
**Current:**
```tsx
<footer className="py-6 border-t border-gray-100 text-center md:py-8">
```

**Updated:**
```tsx
<footer className="py-10 border-t border-gray-100 text-center md:py-12">
```

---

## 3. Pickleball Page (/pickleball/page.tsx)

### Hero Section
**Current:**
```tsx
<section className="pt-8 pb-6 text-center md:pt-12 md:pb-8">
  <h1 className="text-4xl font-bold text-gray-900 mb-6 md:text-6xl md:mb-8 leading-tight">
```

**Updated (match main page sizing):**
```tsx
<section className="pt-12 pb-10 text-center md:pt-20 md:pb-16">
  <h1 className="text-5xl font-bold text-gray-900 mb-6 md:text-7xl md:mb-8 leading-none tracking-tight">
```

### Social Proof (below CTA)
**Current:**
```tsx
<p className="text-lg text-gray-500 mt-3 text-center md:text-base">
  No credit card needed • Filter by pickleball-lined courts
</p>
```

**Updated:**
```tsx
<div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-sm md:text-base text-gray-500">
  <span>No credit card needed</span>
  <span className="hidden sm:inline text-gray-300">|</span>
  <span className="font-medium text-gray-700">Filter by pickleball-lined courts</span>
</div>
```

### All Section Spacing
Update all sections from `py-6 md:py-8` to `py-10 md:py-16`

### Court List Cards
**Current:**
```tsx
className="block p-4 border border-gray-200 rounded-lg hover:border-[#0c372b] hover:bg-gray-50 transition-colors"
```

**Updated:**
```tsx
className="block p-5 border border-gray-200 rounded-xl hover:border-[#0c372b] hover:bg-gray-50 hover:shadow-md transition-all"
```

### FAQ Section
**Current:**
```tsx
<section className="py-6 border-t border-gray-100 md:py-8">
```

**Updated:**
```tsx
<section className="py-12 border-t border-gray-100 md:py-20 bg-gray-50 -mx-4 px-4 md:-mx-8 md:px-8">
```

---

## Quick Reference: Key Changes

| Element | Before | After |
|---------|--------|-------|
| Hero padding | `pt-8 pb-6 md:pt-12 md:pb-8` | `pt-12 pb-10 md:pt-20 md:pb-16` |
| Section padding | `py-6 md:py-8` | `py-10 md:py-16` |
| H2 weight | `font-semibold` | `font-bold` |
| H2 margin | `mb-6 md:mb-8` | `mb-8 md:mb-10` |
| Button corners | `rounded` | `rounded-xl` |
| Button shadow | none | `shadow-lg hover:shadow-xl` |
| Card corners | `rounded-lg` | `rounded-xl` |
| Testimonial bg | white | `bg-gray-50` |

---

## Social Proof Numbers
- **Monthly active:** 2,500+ players check courts monthly
- **Total users:** 15,000+ Seattle players
