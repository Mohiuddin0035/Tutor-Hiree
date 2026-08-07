# Project Proposal & Design Specification
## Project Name: TutorHire — Smart Map-Based Tuition Matching & Academic Tracking Platform

---

### Project Group Members
* **Md. Naimur Rahman Sohan**  
  *ID: 112420186*
* **Moheuddin Sikder Saikat**  
  *ID: 112420035*
* **Mazharul Islam Emon**  
  *ID: 112330803*

---

## 1. Executive Summary
**TutorHire** is a proposed smart, map-based tuition platform designed to directly connect tutors and parents in Bangladesh. Traditional tuition-matching systems are plagued by middleman exploitation, high commission fees, lack of location precision, and safety concerns. TutorHire aims to eliminate these issues by leveraging interactive geospatial visualization, privacy protection, automated credential verification, and a comprehensive student academic tracking system. By fostering direct communication between verified users, TutorHire aims to make home education secure, transparent, and highly efficient.

---

## 2. Problem Statement
The private tutoring ecosystem in Bangladesh operates largely through informal networks or predatory, unregulated agencies. The core challenges include:

1. **Predatory Middlemen & High Commission Fees:** Unofficial agencies often demand 50% to 100% of the tutor's first month's salary as a commission, creating financial strain on student tutors.
2. **Lack of Location Precision:** Traditional platforms match users based on coarse geographic labels (e.g., "Uttara" or "Mirpur"). This often results in tutors commuting long distances, wasting time and transportation costs, or rejecting offers after matching.
3. **Safety & Credential Fraud:** Parents face significant security risks when inviting unverified strangers into their homes. Conversely, tutors have no way to verify if a parent or location is safe. Fake certificates and NID documents are also prevalent.
4. **Zero Parental Visibility & Accountability:** Once a tutor is hired, parents have no structured way to track daily lessons, homework completion, or monthly progress, resulting in poor alignment between student performance and tutoring milestones.

---

## 3. The Solution
**TutorHire** proposes an online matching engine built around geolocation mapping, direct negotiation, and automated quality control. Key components of our solution include:

* **Direct Peer-to-Peer Matching:** Parents and tutors connect directly on the platform, bypassing agency middlemen entirely.
* **Proximity-Based Search:** Real-time search using an interactive map, allowing parents to find tutors within a 1km to 3km radius (and vice-versa).
* **Automated Trust Verification:** AI-driven verification using Optical Character Recognition (OCR) to validate National ID (NID) cards, student IDs, and academic transcripts against user profiles.
* **Proactive Privacy Safeguards:** Approximate location coordinates are displayed publicly using spatial blurring algorithms. Exact addresses and contact info are only unlocked upon mutual consent.
* **Student Study & Performance Tracking:** A dedicated dashboard for progress monitoring, keeping parents continuously updated on student learning.

---

## 4. Key Proposed Features
The platform will support three primary user roles: **Parents (Guardians)**, **Tutors**, and **Administrators**.

### A. Geolocation & Interactive Map Matching
* **Interactive Radar Search:** Users can view tutor availability and open tuition posts on a customized map.
* **Distance Radius Filters:** Searches can be constrained by specific distances (e.g., 500m, 1km, 3km) to minimize travel time.
* **Location Obfuscation:** The system will publicize randomized coordinates within a 500m offset of the user's actual location to prevent tracking or harassment.

### B. Automated Credential Verification
* **OCR-Based ID Scanning:** Tutors upload their NID card and University Student ID. The system uses OCR to extract details and automatically match them against profile inputs.
* **Admin Verification Console:** Flagged profiles or mismatched OCR reads are routed to a human administrator for review.

### C. Student Study & Performance Tracking (Proposed)
* **Daily Lesson Logs:** After each session, the tutor logs the topics covered, assigned homework, and grades the student's responsiveness (e.g., Excellent, Good, Average, Needs Improvement).
* **Parental Performance Dashboard:** Interactive monthly progress charts tracking:
  * Homework completion rates.
  * Subject-wise performance trends.
  * Lesson attendance logs.
* **Visual Graph Analysis:** Utilizing responsive charts to represent monthly performance changes, letting parents see if the investment is yielding academic results.

---

## 5. Unique Selling Points (USP)
* **Hyper-Local Geospatial Discovery:** The first platform in Bangladesh utilizing visual map interactions to match tutors and parents based on precise proximity, rather than arbitrary administrative boundaries.
* **Automated Instant Trust:** Utilizing OCR for immediate security screening, cutting down manual verification queues from days to minutes.
* **End-to-End Academic Lifecycle:** Unlike platforms that stop once a match is made, TutorHire remains valuable throughout the tutoring duration by offering daily study tracking and performance reports.
* **Zero Agent Fees:** Empowering students and parents to transact directly with minimal, predictable fees rather than losing up to 100% of their first month's salary to agencies.

---

## 6. Target Audience
1. **Parents / Guardians:** Middle and upper-class families looking for trusted, highly-qualified academic tutors, language coaches, or admissions mentors for their children.
2. **University Students & Educators:** Undergraduate and graduate students from reputable universities (e.g., BUET, DU, NSU, BRAC) seeking part-time tutoring opportunities to support their educational expenses, as well as professional school teachers.

---

## 7. Revenue & Commission Model
To ensure platform sustainability while maintaining a highly cost-effective and risk-free service, TutorHire utilizes a transaction-based commission model centered entirely around the tutor:

### A. Privacy-First Matching & Contact Restriction
To protect user privacy and prevent off-platform bypass before confirmation:
* **Initial Profile Blurring:** When a guardian browses tutor profiles, they can only see public metrics (Name, University, Department, Rating, Bio). Contact numbers and exact addresses are hidden.
* **Match Requests:** Both parties can initiate match requests, but contact details remain locked until the commission transaction is completed by the tutor.

### B. One-Time 10% Tutor-Paid Commission Fee
Unlike traditional offline agencies that charge 50% to 100% of the first month's salary, TutorHire charges a highly affordable, one-time **10% commission fee of the first month's tutoring salary**, paid exclusively by the tutor:
1. **Guardian-Initiated Request:**
   * A guardian requests a tutor. The tutor sees the job details.
   * If the tutor accepts the offer, the **tutor pays the 10% commission fee** to unlock the guardian's contact number and exact address.
2. **Tutor-Initiated Request:**
   * A tutor applies for a guardian's posted job.
   * Once the guardian accepts/approves the tutor's application, the **tutor pays the 10% commission fee** to unlock the guardian's full contact details.

**Market Rationale (Why Tutors Pay):**  
In Bangladesh, guardians are highly resistant to paying platform or matching fees upfront. If required to pay to find a tutor, they will abandon the app in favor of traditional free alternatives (e.g., local Facebook groups or paper flyers). Tutors—mostly university students in need of part-time income—are highly motivated to pay a small 10% fee if it guarantees a direct, verified link to a high-quality job.

### C. 100% Secure Refund & Verification Policy
Because university/bachelor students often operate on tight budgets, TutorHire ensures their money remains completely secure. If a tuition job does not materialize after unlocking:
1. **Refund Claim:** The tutor fills out a simple refund claim form detailing the issue (e.g., student changed their mind, mismatch of expectations, schedule conflicts) and submits supporting screenshots.
2. **Verification Protocol:** Platform administrators verify the claim by reviewing chat logs or directly calling the guardian to confirm the match failed.
3. **Full Refund Reimbursement:** Once verified (if requested within **24 hours** of the issue), the tutor receives a **100% refund** of their commission fee, ensuring zero financial risk.

---

## 8. Deep-Dive: Why a Map? (Geospatial Rationale)
A frequent question during project design is: *Why use an interactive map instead of a standard drop-down filter (e.g., Division -> District -> Area)?*

### A. The Core Rationale
1. **The Proximity Fallacy of "Areas":** Administrative areas in major cities like Dhaka are massive. For instance, "Uttara" or "Mirpur" covers several square kilometers. Two users who both select "Mirpur" could easily live 5 kilometers apart, making a daily commute highly impractical. A map allows users to see who is *literally* across the street or within a 10-minute walk.
2. **Natural Boundaries and Traffic Realities:** In cities like Dhaka, traffic bottlenecks are dictated by flyovers, train crossings, and main roads rather than postal zones. A tutor might live 500 meters from a student, but if they are separated by a railway track without a crossing, it is a barrier. A visual map lets tutors make smart decisions based on real-world routes.
3. **Immersive Search Experience:** Seeing tutoring opportunities visualised in real-time on a map is significantly more intuitive than sorting through text lists.

### B. Handling High-Density Clusters (e.g., 10,000+ Tutors in one Area)
If TutorHire experiences high adoption, map clutter could make the interface unusable (e.g., thousands of tutor pins overlapping in a single neighborhood). To mitigate this, our proposed map architecture includes:

1. **Marker Clustering (Leaflet.markercluster):** 
   Nearby pins are grouped into single, dynamic cluster markers containing a count (e.g., "150"). Zooming in expands the cluster, dispersing individual markers.
2. **Context-Aware Dynamic Filtering:** 
   The map only renders pins that meet the user’s search parameters (e.g., Class level, Subject, Salary, Gender Preference). This thins the display from thousands of pins to a handful of relevant results.
3. **Viewport-Bounded Sidebar Feed:** 
   As the parent pans or zooms the map, a sidebar list of tutors auto-updates to show only the tutors visible in the current viewport, sorted by rating and verification status. This ensures parents do not have to click individual pins to compare profiles.
4. **Server-Side Spatial Indexing & Pagination:** 
   The backend database uses spatial querying (PostGIS or bounding-box filters) to send only the top 100 most relevant tutor coordinates within the current viewport range, preventing frontend performance lag.

---

## 9. Proposed Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js (React) | File-based routing, server-side rendering (SSR) for SEO, and fast client-side navigation. |
| **Backend Framework** | Java Spring Boot | Robust enterprise-grade framework built on Object-Oriented principles, ideal for writing scalable REST APIs, handling security, and utilizing multithreading. |
| **Styling** | TailwindCSS & Framer Motion | Rapid custom styling paired with smooth micro-animations for premium user experience. |
| **Database** | PostgreSQL | Relational database ideal for handling user credentials, reviews, transactions, and geographic coordinates. |
| **ORM** | Spring Data JPA / Hibernate | Simplifies database interactions using robust object-relational mapping patterns aligned with OOP standards. |
| **Map Rendering** | Leaflet.js & React-Leaflet | Open-source, lightweight map engine that integrates easily with customizable tile providers. |
| **Authentication & Security** | Spring Security & JWT | Industry-standard security architecture for role-based access control (Tutor, Guardian, Admin) and stateless session management. |
| **OCR Processing** | Tesseract (Java Wrapper / API) | OCR engines to read uploaded NID and student cards for identity verification. |
| **File Storage** | AWS S3 / Cloudinary | Highly scalable object storage for NIDs, selfies, and academic documents. |

---

## 10. Future Milestones & Timeline
1. **Phase 1: Foundation & Auth (Weeks 1-2):** Database schema setup, role-based authentication, and profile creation.
2. **Phase 2: Geospatial Mapping (Weeks 3-4):** Leaflet integration, coordinates blurring logic, and spatial queries.
3. **Phase 3: OCR Verification & Security (Weeks 5-6):** Tesseract OCR pipeline implementation and admin review dashboards.
4. **Phase 4: Academic Tracking & Revenue (Weeks 7-8):** Development of student tracking charts, payment gateway setup, and subscription hooks.
5. **Phase 5: Beta Testing & Polishing (Weeks 9-10):** User testing, stress-testing map rendering under simulated loads, and finalizing UI polish.
