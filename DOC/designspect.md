# CSE FEST 2026

# DESIGN SYSTEM SPECIFICATION

Version 1.0

This document defines the visual language, component architecture, spacing system, motion rules, interaction patterns, and UI standards used throughout the platform.

This becomes the single source of truth for:

* Figma
* Frontend Development
* Design Consistency
* Future Expansion

---

# Design Principles

Every screen must feel:

* Premium
* Modern
* Fast
* Clean
* Intelligent

The system should prioritize:

Clarity over decoration.

Hierarchy over complexity.

Consistency over creativity.

---

# Visual Keywords

Premium

Elegant

Technical

Modern

Sophisticated

Creative

Professional

Innovative

---

# Brand Feel

Imagine:

Apple simplicity

Linear precision

Vercel polish

GitHub credibility

Stripe clarity

---

# Design Tokens

## Border Radius

Small

8px

---

Medium

12px

---

Large

16px

---

Extra Large

24px

---

Full

999px

Used For:

Badges

Pills

Status Indicators

---

# Shadow System

Level 1

Cards

Subtle

---

Level 2

Hover State

---

Level 3

Modals

---

Level 4

Hero Elements

Premium Glow

---

# Spacing System

Never use arbitrary values.

Use only tokenized spacing.

4

8

12

16

20

24

32

40

48

64

80

96

128

---

# Layout Tokens

Page Padding

Desktop

32px

---

Tablet

24px

---

Mobile

16px

---

Section Gap

96px

---

Component Gap

24px

---

Card Padding

24px

---

# Typography System

## Heading Font

Space Grotesk

---

## Body Font

Inter

---

## Numeric Font

Geist Mono

---

# Typography Scale

Display XL

96px

Hero Titles

---

Display Large

72px

Hero Sections

---

H1

56px

---

H2

48px

---

H3

36px

---

H4

28px

---

H5

24px

---

Body Large

18px

---

Body

16px

---

Small

14px

---

Caption

12px

---

# Color System

## Primary

Deep Indigo

Brand Identity

---

## Secondary

Electric Violet

Highlights

---

## Accent

Soft Cyan

Interactive Elements

---

## Success

Green

---

## Warning

Amber

---

## Error

Red

---

# Surface System

## Surface 1

Main Background

---

## Surface 2

Cards

---

## Surface 3

Elevated Components

---

## Surface 4

Modals

---

# Glassmorphism Rules

Use Sparingly.

Allowed:

Navbar

Ticker

Modals

Hero Elements

Stats Cards

---

Avoid:

Forms

Tables

Dense Information Areas

---

# Animation System

## Philosophy

Motion should communicate:

Meaning

Feedback

Hierarchy

---

Never animate for decoration alone.

---

# Animation Durations

Fast

150ms

---

Normal

250ms

---

Complex

400ms

---

Page

500ms

---

# Hover Behaviors

Cards

Lift

Scale 1.02

Shadow Increase

---

Buttons

Subtle Scale

Background Transition

---

Navigation

Underline Animation

---

# Page Transitions

Fade

Slide

Blur

---

Maximum Duration

500ms

---

# Icon System

Library

Lucide Icons

Only

---

No mixed icon sets.

---

# Component Library

## Buttons

### Primary Button

Purpose

Main CTA

Examples

Register

Submit

Create Team

---

Style

Filled

Strong Contrast

---

### Secondary Button

Purpose

Secondary Actions

---

### Ghost Button

Purpose

Low Priority Actions

---

### Destructive Button

Purpose

Delete

Reject

Remove

---

# Input Components

## Text Input

States

Default

Focused

Error

Disabled

---

## Text Area

For

Descriptions

Bio

Notes

---

## Select

Searchable

---

## Multi Select

Skills

Tags

---

## File Upload

Drag & Drop

Preview

Validation

Progress Indicator

---

# Card System

Cards are core to the platform.

---

## Competition Card

Contains

Banner

Title

Description

Prize

Deadline

CTA

---

## Team Card

Contains

Team Name

Members

Competition

Status

---

## Stats Card

Contains

Metric

Value

Trend

---

## Notification Card

Contains

Title

Description

Timestamp

---

# Table System

Use TanStack Table.

---

Features

Search

Filter

Sort

Pagination

Column Visibility

Export

---

# Status System

## Verification Status

Incomplete

Pending

Verified

---

## Submission Status

Draft

Submitted

Under Review

Selected

Rejected

---

## Payment Status

Pending

Approved

Rejected

Resubmission Required

---

## Competition Status

Draft

Published

Registration Open

Registration Closed

Archived

---

# Empty States

Every empty page must have:

Illustration

Explanation

Action Button

---

Bad Example

"No Data"

---

Good Example

"No Teams Yet

Create your first team to join a competition."

---

# Loading States

Use Skeleton Loaders.

Never use:

Spinners only.

---

# Modal System

Sizes

Small

Medium

Large

Fullscreen

---

Used For

Confirmation

Editing

Review

Preview

---

# Notification System

Types

Info

Success

Warning

Error

---

Placement

Top Right

Desktop

Bottom

Mobile

---

# Dashboard Patterns

## KPI Cards

Large Numbers

Trend Indicator

Icon

---

## Activity Feed

Timeline Style

Newest First

---

## Data Tables

Sticky Header

Bulk Actions

Search

---

## Detail Panels

Master Detail Layout

---

# Admin Dashboard Design Rules

Must Feel Like:

Stripe

Linear

Vercel

---

Avoid:

Traditional Admin Templates

---

Sidebar

Collapsible

---

Topbar

Global Search

Notifications

Profile

---

# Participant Dashboard Design Rules

Must Feel Simpler Than Admin.

---

Focus On

Teams

Competitions

Deadlines

Notifications

---

Quick Actions Always Visible.

---

# Mobile Design System

Mobile First

For Participant Experience

---

Bottom Navigation

Recommended

---

Touch Targets

Minimum 44px

---

No Horizontal Scrolling

Ever

---

# Accessibility Standards

Keyboard Accessible

---

Visible Focus States

---

Proper Labels

---

Semantic HTML

---

Contrast Compliance

---

# Error Handling UX

Every Error Must:

Explain

Why

What Happened

How To Fix

---

Bad

"Something Went Wrong"

---

Good

"Payment screenshot exceeds 5MB. Please upload a smaller image."

---

# Design Do's

Use clear hierarchy.

Use whitespace generously.

Use motion intentionally.

Use consistent spacing.

Use reusable components.

Keep actions obvious.

Design mobile first.

Prioritize readability.

---

# Design Don'ts

Do not use random spacing.

Do not use random colors.

Do not mix icon libraries.

Do not overuse glassmorphism.

Do not create hidden actions.

Do not create multi-step flows unnecessarily.

Do not use generic dashboard templates.

Do not use excessive animations.

Do not sacrifice usability for aesthetics.

---

# Final Design Goal

The platform should feel like a premium technology product that happens to manage a university festival.

Users should immediately feel:

"This is professionally built."

not

"This is another university registration website."
