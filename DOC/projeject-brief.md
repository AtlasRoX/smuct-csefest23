# CSE Fest 2026 Management Platform

## Project Brief

### Project Title

CSE Fest 2026 Management Platform

### Organization

Department of Computer Science & Engineering (CSE)

Department of Computer Science & Information Technology (CSIT)

Shanto-Mariam University of Creative Technology (SMUCT)

### Event Date

July 18, 2026

### Platform Type

Festival Management Platform + Competition Management System + Registration Portal + Submission Management System

---

# Executive Summary

CSE Fest 2026 Management Platform is a modern web-based system designed to manage every aspect of SMUCT's annual technology festival.

The platform serves three primary purposes:

1. Public-facing festival website
2. Participant registration and competition management portal
3. Administrative management and evaluation system

Unlike a traditional event website, the platform functions as a complete operational system capable of handling registrations, team management, competition workflows, judging, payment verification, analytics, announcements, and data synchronization.

The goal is to eliminate manual spreadsheet management, fragmented communication, and repetitive administrative tasks while providing a premium experience for participants and organizers.

---

# Project Vision

To create the most modern and professionally managed university technology festival platform in Bangladesh, providing a seamless experience for students, organizers, and competition administrators.

The platform should feel comparable to modern products such as Linear, Vercel, Stripe Dashboard, and GitHub Universe rather than a traditional university portal.

---

# Primary Objectives

### Participant Experience

Provide a frictionless experience for participants to:

* Register quickly
* Create and manage teams
* Join competitions
* Submit proposals
* Pay entry fees
* Track application status
* Receive notifications
* Access competition information

### Organizer Experience

Provide organizers with a centralized control center to:

* Create competitions
* Configure rules
* Manage participants
* Review submissions
* Verify payments
* Rank teams
* Publish results
* Synchronize data with spreadsheets
* Monitor festival analytics

### Operational Efficiency

Replace manual workflows involving:

* Google Forms
* Multiple spreadsheets
* Messenger groups
* Manual participant tracking
* Manual ranking calculations

with a unified system.

---

# Competition Categories

## External Competitions

Open to students from all universities in Bangladesh.

### Software Project Showcase

Team Size:
1–3 Members

Phase Structure:
Phase 1 → Proposal Submission
Phase 2 → Final Presentation

Submission:
Google Docs Proposal

---

### IoT Showcase

Team Size:
1–4 Members

Phase Structure:
Phase 1 → Proposal Submission
Phase 2 → Final Demonstration

Submission:
Google Docs Proposal

---

### Idea Showcase

Team Size:
1–3 Members

Phase Structure:
Phase 1 → Proposal Submission
Phase 2 → Final Presentation

Submission:
Google Docs Proposal

---

## Internal Competitions

Open exclusively to SMUCT students.

### Competitive Programming

Team Size:
1–3 Members

### Datathon

Team Size:
1–3 Members

### Capture The Flag (CTF)

Team Size:
1–3 Members

### Robo Soccer

Admin Configurable

### Line Following Robot (LFR)

Admin Configurable

### Valorant

Admin Configurable

### FIFA

Admin Configurable

---

# User Types

## Participant

Students who register and participate in competitions.

Permissions:

* Create account
* Complete profile
* Upload student ID
* Create teams
* Join teams
* Register competitions
* Submit proposals
* Submit payments
* View status
* Receive notifications

---

## Admin

Festival organizers and management team.

Permissions:

* Full platform access
* Competition management
* Participant management
* Submission review
* Payment verification
* Judging
* Analytics access
* Content management
* Spreadsheet synchronization

---

# Participant Profile System

Each participant must maintain a complete profile.

## Required Information

### Personal Information

* Full Name
* Email Address
* Phone Number
* Gender

### Academic Information

* University
* Department
* Semester/Year
* Student ID

### Verification

* Student ID Front Image
* Student ID Back Image

### Professional Information

* GitHub Profile
* Portfolio Website
* Skills
* Short Bio

### Festival Information

* T-Shirt Size

---

# Student Verification System

Every participant must be verified once.

Status Flow:

Incomplete
→ Submitted
→ Verified

Only verified participants can register for competitions.

Purpose:

* Prevent fake registrations
* Ensure participant authenticity
* Maintain event quality

---

# Team Management System

The platform will implement a professional invitation-based team management system.

### Team Creation

Team leader creates a team.

Team Information:

* Team Name
* Team Logo (Optional)
* Competition
* Team Leader

### Member Invitations

Leader enters member email.

System checks existing accounts.

Invitation sent.

Member accepts invitation.

After acceptance:

* Member becomes official team member
* Team roster updates automatically

### Leadership Transfer

Team leaders may transfer ownership to another team member.

---

# Competition Registration Workflow

## External Competitions

### Phase 1

Free Registration

Process:

Create Account
→ Verify Profile
→ Create Team
→ Submit Proposal
→ Await Review

### Review Stage

Admin evaluates submissions.

Possible Results:

* Selected
* Rejected

### Phase 2

Selected teams:

Submit Payment
→ Payment Verification
→ Finalist Status

---

## Internal Competitions

Create Account
→ Verify Profile
→ Register Team
→ Submit Payment
→ Verification
→ Participation

---

# Submission Management System

Submission Method:

Google Docs Link

Workflow:

Draft
→ Submitted
→ Under Review
→ Selected / Rejected

No revision cycle.

Submitted proposal is considered final.

Each competition may provide:

* Submission Template
* Guideline Document
* Rulebook PDF

Configured by Admin.

---

# Payment Verification System

Supported Methods:

* bKash
* Nagad

Participant Submission:

* Transaction ID
* Payment Screenshot

Status Types:

* Pending
* Approved
* Rejected
* Resubmission Allowed

Admin manually verifies all payments.

---

# Judging & Evaluation System

Judging is conducted entirely by Admin.

Each competition can define custom evaluation criteria.

Example:

Innovation
Technical Complexity
Feasibility
Impact
Presentation Quality

Admin enters scores.

System automatically:

* Calculates totals
* Calculates rankings
* Generates scoreboards

Finalist publication remains under admin control.

---

# Competition Builder

Admin can dynamically create competitions.

Configurable Fields:

### Basic Information

* Competition Name
* Description
* Competition Type
* Banner
* Cover Image

### Registration

* Registration Start Date
* Registration End Date

### Team Rules

* Solo Allowed
* Team Allowed
* Minimum Members
* Maximum Members

### Eligibility

* External
* Internal

### Submission Settings

* Template Link
* Submission Required
* Rulebook PDF

### Payment Settings

* Entry Fee
* Payment Instructions

### Evaluation

* Judging Criteria
* Criteria Weightage

### Final Round

* Finalist Limit

### Prize Information

* Prize Pool
* Champion Prize
* Runner-Up Prize
* Second Runner-Up Prize

---

# Admin Dashboard

The dashboard acts as the operational control center.

## Analytics Overview

Displays:

* Total Participants
* Total Teams
* Total Competitions
* Pending Reviews
* Pending Payments
* Selected Teams
* Participating Universities
* Total Revenue
* Expected Revenue
* Collection Rate

---

## Competition Analytics

Displays:

* Registrations Per Competition
* Revenue Per Competition
* Submission Counts
* Selection Statistics

---

## University Analytics

Displays:

* Team Distribution
* University Participation Rankings

---

## Activity Feed

Displays recent events:

* New Team Created
* Submission Received
* Payment Submitted
* Payment Approved
* Competition Updated

---

# Google Sheets Synchronization

Admin may synchronize platform data directly to Google Sheets.

Workflow:

Push Initial Data

↓

Sync Changes

Capabilities:

* Create structured spreadsheets
* Update modified rows
* Prevent duplicate entries
* Detect pending changes

Admin selects:

* Competitions
* Fields
* Dataset types

Examples:

Participants
Teams
Payments
Submissions
Rankings

---

# Content Management System

Admins can manage platform content without code changes.

## Announcements

Create:

* Title
* Description
* Priority
* Publish Date

Displayed across:

* Homepage
* Dashboard
* Notifications

---

## News Ticker

Homepage scrolling announcements.

Examples:

Registration Open

Deadline Extended

Finalists Announced

---

## FAQ Management

Dynamic FAQ creation.

Question
Answer
Display Order

---

## Contact Management

Editable:

* Email
* Phone
* Facebook
* LinkedIn
* Address
* Maps Link

---

# Public Website

## Homepage Sections

### Hero Section

Festival introduction.

### About Section

Festival overview.

### Competition Showcase

Dynamic competition cards.

### Timeline

Festival milestones.

### Prize Pool

Competition rewards.

### Statistics

Festival metrics.

### FAQ

Frequently asked questions.

### Contact

Organizer information.

### Footer

Navigation and resources.

---

# Design Philosophy

The platform should communicate innovation, professionalism, and technical excellence.

### Inspiration

* Apple
* Linear
* Vercel
* GitHub Universe
* Modern Awwwards Experiences

### Visual Direction

* Dark-first interface
* Deep indigo branding
* Premium gradients
* Glassmorphism accents
* Motion-rich interactions
* High-quality typography

### Avoid

* Generic university portal designs
* Excessive neon cyberpunk aesthetics
* Overly corporate layouts
* Template-like interfaces

---

# Success Criteria

The project will be considered successful if:

* 100% competition registrations occur through the platform
* Organizers eliminate manual registration tracking
* Payment verification is centralized
* Judging workflows become streamlined
* Google Sheet synchronization reduces manual data entry
* Participants can complete all actions without organizer assistance
* The platform becomes the single source of truth for CSE Fest 2026
