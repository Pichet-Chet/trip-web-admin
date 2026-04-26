# API Architecture
# Trip Communication Platform — C# .NET Web API

**Version:** 1.0
**Date:** 30 March 2026
**Status:** Draft
**Tech Stack:** ASP.NET Core 10 + Entity Framework Core + PostgreSQL 16
**Reference:** 05-Technical-Architecture.md, 09-System-Development-Blueprint.md

---

## 1. ภาพรวมสถาปัตยกรรม

### 1.1 แนวคิดหลัก

ระบบนี้ใช้สถาปัตยกรรมแบบ **Single API + Route Prefix** — API เดียวรองรับ 3 กลุ่มผู้ใช้ผ่าน route prefix ที่แยกจากกัน:

```
https://api.[your-domain.com]/api/admin/*     ← บริษัททัวร์ / ไกด์อิสระ / Personal
https://api.[your-domain.com]/api/client/*    ← ลูกทริป (Guest / Follower)
https://api.[your-domain.com]/api/staff/*     ← เจ้าหน้าที่ระบบ
```

### 1.2 System Diagram

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Admin   │  │  Client  │  │  Staff   │  │   Info   │
│ (Next.js)│  │ (Next.js)│  │ (Next.js)│  │ (Next.js)│
│  :3001   │  │  :3000   │  │  :3002   │  │  :3003   │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │              │
     │    HTTPS    │    HTTPS    │    HTTPS     │
     └──────┬──────┘──────┬──────┘──────────────┘
            │             │
            ▼             ▼
┌──────────────────────────────────────────────────┐
│              Nginx Reverse Proxy                  │
│              api.[your-domain.com] (TLS)                 │
└──────────────────────┬───────────────────────────┘
                       │
            ┌──────────▼───────────┐
            │   TripApp.API          │
            │   ASP.NET Core 9      │
            │   :5000               │
            ├───────────────────────┤
            │ ┌───────────────────┐ │
            │ │  Middleware Stack  │ │
            │ │  • Exception      │ │
            │ │  • Rate Limit     │ │
            │ │  • CORS           │ │
            │ │  • Auth (JWT)     │ │
            │ │  • Logging        │ │
            │ └───────────────────┘ │
            │ ┌───────────────────┐ │
            │ │  Controllers       │ │
            │ │  /api/admin/*     │ │
            │ │  /api/client/*    │ │
            │ │  /api/staff/*     │ │
            │ └───────────────────┘ │
            │ ┌───────────────────┐ │
            │ │  Services          │ │
            │ │  (Business Logic)  │ │
            │ └───────────────────┘ │
            │ ┌───────────────────┐ │
            │ │  Data Access       │ │
            │ │  (EF Core)         │ │
            │ └───────────────────┘ │
            └───────────┬──────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
   ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
   │ PostgreSQL │ │Cloudflare │ │   LINE    │
   │    16      │ │    R2     │ │Messaging  │
   │  :5432     │ │ (Storage) │ │   API     │
   └───────────┘ └───────────┘ └───────────┘
```

### 1.3 ทำไมเลือก Single API

| ข้อพิจารณา | ผลลัพธ์ |
|---|---|
| ทีม 1-2 คน | Deploy + maintain 1 service = จัดการไหว |
| Database เดียวกัน | ไม่ต้อง sync data ข้าม service |
| Business logic ร่วมกัน | TripService เขียนครั้งเดียว ใช้ 3 controllers |
| ต้นทุนต่ำ | VPS 1 ตัว รัน API + PostgreSQL |
| แยกได้ทีหลัง | ถ้า traffic สูง → แยก service ที่เป็น bottleneck |

---

## 2. Solution Structure

### 2.1 โครงสร้าง Solution

```
TripApp.sln
│
├── src/
│   ├── TripApp.API/                    ← Web API (Entry Point)
│   ├── TripApp.Services/               ← Business Logic
│   ├── TripApp.Models/                 ← Entities, DTOs, Enums
│   └── TripApp.Data/                   ← EF Core DbContext + Configurations
│
├── tests/
│   ├── TripApp.Services.Tests/         ← Unit Tests
│   └── TripApp.API.Tests/             ← Integration Tests
│
├── docker/
│   ├── docker-compose.yml             ← PostgreSQL + API
│   ├── docker-compose.dev.yml         ← Development overrides
│   └── Dockerfile                     ← API container
│
├── .github/
│   └── workflows/
│       └── deploy.yml                 ← CI/CD pipeline
│
├── TripApp.sln
└── README.md
```

### 2.2 Layer Dependency

```
TripApp.API                          ← Presentation Layer
    │
    ├──► TripApp.Services            ← Business Logic Layer
    │        │
    │        ├──► TripApp.Models     ← Domain Layer
    │        │
    │        └──► TripApp.Data       ← Data Access Layer
    │                 │
    │                 └──► TripApp.Models
    │
    └──► TripApp.Models              ← DTOs for request/response

กฎ:
  • API       → รู้จักทุก layer (DI registration)
  • Services  → รู้จัก Models + Data — ไม่รู้จัก API
  • Data      → รู้จัก Models — ไม่รู้จัก Services, API
  • Models    → ไม่รู้จักใคร (no dependency)
```

### 2.3 รายละเอียดแต่ละ Project

#### TripApp.API (Presentation Layer)

```
TripApp.API/
├── Controllers/
│   ├── Admin/                         ← [Authorize("AdminPolicy")]
│   │   ├── AuthController.cs          ← POST register, login, logout
│   │   ├── CompanyController.cs       ← GET/PUT company profile, POST logo
│   │   ├── TripController.cs          ← CRUD trips, publish/unpublish
│   │   ├── DayController.cs           ← CRUD days, reorder
│   │   ├── ActivityController.cs      ← CRUD activities, reorder
│   │   ├── PostController.cs          ← CRUD posts
│   │   ├── NotifyController.cs        ← POST send/resend notification
│   │   ├── PortfolioController.cs     ← GET/PUT portfolio settings
│   │   ├── UsageController.cs         ← GET usage & quota
│   │   ├── FeedbackController.cs      ← POST submit feedback
│   │   └── UploadController.cs        ← POST upload image
│   │
│   ├── Client/                        ← [AllowAnonymous] เป็นหลัก
│   │   ├── TripPublicController.cs    ← GET trip by slug (public)
│   │   ├── ImmigrationController.cs   ← GET immigration view
│   │   ├── FollowController.cs        ← POST follow (LINE/Web Push)
│   │   ├── LineWebhookController.cs   ← POST LINE webhook
│   │   ├── AcknowledgeController.cs   ← POST read receipt
│   │   └── PortfolioPublicController.cs ← GET portfolio (public)
│   │
│   └── Staff/                         ← [Authorize("StaffPolicy")]
│       ├── StaffAuthController.cs     ← POST staff login
│       ├── DashboardController.cs     ← GET system overview
│       ├── CompanyMgmtController.cs   ← GET/PUT companies, verify, suspend
│       ├── TripMgmtController.cs      ← GET trips, moderate
│       ├── UserMgmtController.cs      ← CRUD users
│       ├── PostMgmtController.cs      ← GET posts, moderate
│       ├── SupportController.cs       ← GET/PUT tickets, reply
│       ├── PaymentController.cs       ← GET payment history
│       ├── ReportController.cs        ← GET analytics, export
│       ├── SettingController.cs       ← GET/PUT plans, announcements
│       └── StaffMgmtController.cs     ← CRUD staff accounts
│
├── Middleware/
│   ├── ExceptionMiddleware.cs         ← Global error handling
│   ├── RateLimitMiddleware.cs         ← Rate limiting per endpoint group
│   └── RequestLoggingMiddleware.cs    ← Structured request/response logging
│
├── Extensions/
│   ├── ServiceCollectionExtensions.cs ← DI registration helpers
│   ├── ClaimsPrincipalExtensions.cs   ← User.GetCompanyId(), User.GetStaffId()
│   └── MappingExtensions.cs          ← Entity ↔ DTO mapping
│
├── Filters/
│   └── ValidateModelFilter.cs         ← Auto model validation
│
├── Program.cs                         ← App entry point + middleware pipeline
├── appsettings.json                   ← Configuration
├── appsettings.Development.json
└── TripApp.API.csproj
```

#### TripApp.Services (Business Logic Layer)

```
TripApp.Services/
├── Auth/
│   ├── IAuthService.cs
│   └── AuthService.cs                 ← Register, Login, HashPassword, VerifyPassword
│
├── Company/
│   ├── ICompanyService.cs
│   └── CompanyService.cs              ← GetCompany, UpdateProfile, UploadLogo
│
├── Trip/
│   ├── ITripService.cs
│   └── TripService.cs                 ← Create, Update, Delete, Publish, Unpublish, List
│
├── Day/
│   ├── IDayService.cs
│   └── DayService.cs                  ← Add, Update, Delete, Reorder
│
├── Activity/
│   ├── IActivityService.cs
│   └── ActivityService.cs             ← Add, Update, Delete, Reorder
│
├── Post/
│   ├── IPostService.cs
│   └── PostService.cs                 ← Create, Update, Delete, List, ChangeStatus
│
├── Publish/
│   ├── IPublishService.cs
│   └── PublishService.cs              ← GenerateSlug, Publish, Unpublish, GenerateQR
│
├── Follow/
│   ├── IFollowService.cs
│   └── FollowService.cs              ← FollowByLine, FollowByWebPush, Unfollow
│
├── Notification/
│   ├── INotificationService.cs
│   ├── NotificationService.cs         ← SendToAllFollowers, ResendToUnread
│   ├── ILineMessagingService.cs
│   ├── LineMessagingService.cs        ← PushMessage, ReplyMessage, VerifySignature
│   ├── IWebPushService.cs
│   └── WebPushService.cs             ← SendPushNotification
│
├── ChangeLog/
│   ├── IChangeLogService.cs
│   └── ChangeLogService.cs           ← DetectChanges, CreateChangeLog, GetHistory
│
├── Acknowledge/
│   ├── IAcknowledgeService.cs
│   └── AcknowledgeService.cs         ← Acknowledge, GetReadReceipts
│
├── Upload/
│   ├── IUploadService.cs
│   └── UploadService.cs              ← UploadImage, DeleteImage (Cloudflare R2)
│
├── Analytics/
│   ├── IAnalyticsService.cs
│   └── AnalyticsService.cs           ← IncrementView, GetStats, GetReport
│
├── Portfolio/
│   ├── IPortfolioService.cs
│   └── PortfolioService.cs           ← GetPortfolio, UpdateSettings, GetPublicPortfolio
│
├── Support/
│   ├── ISupportService.cs
│   └── SupportService.cs             ← CreateTicket, Reply, UpdateStatus, ListTickets
│
├── Common/
│   ├── SlugGenerator.cs              ← Generate unique URL slug
│   └── QrCodeGenerator.cs            ← Generate QR Code image
│
└── TripApp.Services.csproj
```

#### TripApp.Models (Domain Layer)

```
TripApp.Models/
├── Entities/
│   ├── Company.cs                     ← mst_companies
│   ├── User.cs                        ← mst_users
│   ├── StaffUser.cs                   ← mst_staff_users
│   ├── TripPlan.cs                    ← trip_plans
│   ├── TripDay.cs                     ← trip_days
│   ├── TripActivity.cs               ← trip_activities
│   ├── Post.cs                        ← trip_posts
│   ├── Follower.cs                    ← noti_followers
│   ├── ChangeLog.cs                   ← noti_change_logs
│   ├── Acknowledgement.cs            ← noti_acknowledgements
│   ├── SupportTicket.cs              ← sup_tickets
│   └── TicketReply.cs                ← sup_ticket_replies
│
├── DTOs/
│   ├── Common/
│   │   ├── ApiResponse.cs            ← ApiResponse<T> wrapper
│   │   ├── PaginatedResponse.cs      ← PaginatedResponse<T>
│   │   └── ErrorResponse.cs          ← Error detail
│   │
│   ├── Admin/
│   │   ├── Auth/
│   │   │   ├── RegisterRequest.cs
│   │   │   ├── LoginRequest.cs
│   │   │   └── AuthResponse.cs
│   │   ├── Company/
│   │   │   ├── UpdateCompanyRequest.cs
│   │   │   └── CompanyResponse.cs
│   │   ├── Trip/
│   │   │   ├── CreateTripRequest.cs
│   │   │   ├── UpdateTripRequest.cs
│   │   │   ├── TripResponse.cs
│   │   │   ├── TripListResponse.cs
│   │   │   └── TripDetailResponse.cs
│   │   ├── Day/
│   │   │   ├── CreateDayRequest.cs
│   │   │   ├── UpdateDayRequest.cs
│   │   │   ├── ReorderDaysRequest.cs
│   │   │   └── DayResponse.cs
│   │   ├── Activity/
│   │   │   ├── CreateActivityRequest.cs
│   │   │   ├── UpdateActivityRequest.cs
│   │   │   ├── ReorderActivitiesRequest.cs
│   │   │   └── ActivityResponse.cs
│   │   ├── Post/
│   │   │   ├── CreatePostRequest.cs
│   │   │   ├── UpdatePostRequest.cs
│   │   │   └── PostResponse.cs
│   │   ├── Notification/
│   │   │   ├── SendNotifyRequest.cs
│   │   │   ├── ReadReceiptResponse.cs
│   │   │   └── ChangeLogResponse.cs
│   │   ├── Portfolio/
│   │   │   ├── UpdatePortfolioRequest.cs
│   │   │   └── PortfolioResponse.cs
│   │   ├── Usage/
│   │   │   └── UsageResponse.cs
│   │   └── Feedback/
│   │       └── SubmitFeedbackRequest.cs
│   │
│   ├── Client/
│   │   ├── TripPublicResponse.cs
│   │   ├── ImmigrationResponse.cs
│   │   ├── FollowLineRequest.cs
│   │   ├── FollowWebPushRequest.cs
│   │   ├── FollowResponse.cs
│   │   ├── AcknowledgeResponse.cs
│   │   └── PortfolioPublicResponse.cs
│   │
│   └── Staff/
│       ├── StaffLoginRequest.cs
│       ├── DashboardResponse.cs
│       ├── CompanyListResponse.cs
│       ├── CompanyDetailResponse.cs
│       ├── VerifyCompanyRequest.cs
│       ├── TripStaffResponse.cs
│       ├── UserListResponse.cs
│       ├── TicketListResponse.cs
│       ├── TicketReplyRequest.cs
│       ├── PaymentListResponse.cs
│       ├── ReportResponse.cs
│       ├── UpdatePlanRequest.cs
│       ├── AnnouncementRequest.cs
│       └── StaffUserRequest.cs
│
├── Enums/
│   ├── AccountType.cs                 ← Company, FreelanceGuide, Personal
│   ├── TripStatus.cs                  ← Draft, Published, Unpublished
│   ├── PostStatus.cs                  ← Draft, Published, Closed
│   ├── ActivityType.cs                ← Attraction, Restaurant, Hotel, Transport, Shopping, Other
│   ├── FollowChannel.cs              ← Line, WebPush
│   ├── UserRole.cs                    ← Owner, Editor
│   ├── StaffRole.cs                   ← Admin, Support, Viewer
│   ├── TicketStatus.cs                ← Open, Pending, Resolved, Closed
│   ├── TicketType.cs                  ← Bug, FeatureRequest, Question, Other
│   └── Language.cs                    ← Thai, English, Japanese
│
├── JsonModels/
│   ├── AirlineInfo.cs
│   ├── Accommodation.cs
│   ├── EmergencyContact.cs
│   ├── ChangeEntry.cs
│   └── WebPushSubscription.cs
│
└── TripApp.Models.csproj
```

#### TripApp.Data (Data Access Layer)

```
TripApp.Data/
├── AppDbContext.cs                  ← Main DbContext
│
├── Configurations/
│   ├── CompanyConfiguration.cs
│   ├── UserConfiguration.cs
│   ├── StaffUserConfiguration.cs
│   ├── TripPlanConfiguration.cs
│   ├── TripDayConfiguration.cs
│   ├── TripActivityConfiguration.cs
│   ├── PostConfiguration.cs
│   ├── FollowerConfiguration.cs
│   ├── ChangeLogConfiguration.cs
│   ├── AcknowledgementConfiguration.cs
│   ├── SupportTicketConfiguration.cs
│   └── TicketReplyConfiguration.cs
│
├── Migrations/                        ← EF Core auto-generated
│
├── Seeds/
│   └── SeedData.cs                    ← Initial data (preset covers, emergency contacts)
│
└── TripApp.Data.csproj
```

---

## 3. Database Schema

### 3.1 ER Diagram

```
┌─────────────────┐       ┌─────────────────┐
│  mst_companies   │──────<│   mst_users      │
│─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │
│ name            │       │ company_id (FK) │
│ account_type    │       │ email           │
│ logo_url        │       │ password_hash   │
│ phone           │       │ name            │
│ line_id         │       │ role            │
│ facebook_url    │       │ is_active       │
│ instagram_url   │       │ created_at      │
│ website_url     │       │ updated_at      │
│ tat_license     │       └─────────────────┘
│ portfolio_enabled│
│ portfolio_slug  │       ┌──────────────────┐
│ tier            │       │ mst_staff_users   │
│ trip_quota_used │       │──────────────────│
│ created_at      │       │ id (PK)          │
│ updated_at      │       │ email            │
└────────┬────────┘       │ password_hash    │
         │                │ name             │
         │                │ role             │
    ┌────▼────────────┐   │ is_active        │
    │  trip_plans      │   │ created_at       │
    │─────────────────│   └──────────────────┘
    │ id (PK)         │
    │ company_id (FK) │    ┌──────────────────┐
    │ title           │    │  trip_posts       │
    │ slug (UNIQUE)   │    │──────────────────│
    │ destination     │    │ id (PK)          │
    │ start_date      │    │ company_id (FK)  │
    │ end_date        │    │ title            │
    │ cover_image_url │    │ destination      │
    │ travelers_count │    │ description      │
    │ language        │    │ highlights       │
    │ airline_info    │(J) │ images           │(J)
    │ accommodations  │(J) │ price            │
    │ emergency_contacts│(J)│ duration         │
    │ important_notes │    │ travel_period    │
    │ status          │    │ slots            │
    │ edit_count      │    │ tags             │(J)
    │ view_count      │    │ status           │
    │ published_at    │    │ view_count       │
    │ created_at      │    │ inquiry_count    │
    │ updated_at      │    │ created_at       │
    └──┬──────┬───────┘    │ updated_at       │
       │      │            └──────────────────┘
       │      │
  ┌────▼──┐  ┌▼───────────────┐
  │trip_  │  │noti_followers   │
  │days   │  │─────────────────│
  │───────│  │ id (PK)         │
  │id (PK)│  │ trip_id (FK)    │
  │trip_id│  │ display_name    │
  │day_num│  │ channel         │
  │title  │  │ line_user_id    │
  │subtitle│  │ web_push_sub   │(J)
  │cover  │  │ followed_at     │
  │date   │  └────────┬────────┘
  │sort   │           │
  └──┬────┘      ┌────▼────────────┐
     │           │noti_change_logs  │
┌────▼──────┐    │─────────────────│
│trip_      │    │ id (PK)         │
│activities │    │ trip_id (FK)    │
│───────────│    │ changed_by (FK) │
│id (PK)    │    │ changes         │(J)
│day_id (FK)│    │ summary_text    │
│time       │    │ noti_sent       │
│name       │    │ noti_sent_at    │
│description│    │ created_at      │
│type       │    └────────┬────────┘
│place_name │             │
│lat        │    ┌────────▼─────────┐
│lng        │    │noti_              │
│maps_link  │    │acknowledgements  │
│image_url  │    │──────────────────│
│emoji      │    │ id (PK)          │
│sort_order │    │ changelog_id (FK)│
│created_at │    │ follower_id (FK) │
│updated_at │    │ acknowledged_at  │
└───────────┘    └──────────────────┘

(J) = JSONB column

┌──────────────────┐       ┌──────────────────┐
│  sup_tickets      │──────<│ sup_ticket_replies │
│──────────────────│       │──────────────────│
│ id (PK)          │       │ id (PK)          │
│ company_id (FK)  │       │ ticket_id (FK)   │
│ subject          │       │ message          │
│ description      │       │ is_staff_reply   │
│ type             │       │ replied_by       │
│ status           │       │ created_at       │
│ screenshot_url   │       └──────────────────┘
│ created_at       │
│ updated_at       │
└──────────────────┘
```

### 3.2 Entity Definitions

#### mst_companies

```csharp
public class Company
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public AccountType AccountType { get; set; }    // Company, FreelanceGuide, Personal
    public string? LogoUrl { get; set; }
    public string? Phone { get; set; }
    public string? LineId { get; set; }
    public string? FacebookUrl { get; set; }
    public string? InstagramUrl { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? TatLicense { get; set; }         // เลขใบอนุญาต TAT (Company เท่านั้น)

    // Portfolio
    public bool PortfolioEnabled { get; set; }
    public string? PortfolioSlug { get; set; }      // [your-domain.com]/p/{slug}

    // Billing
    public string Tier { get; set; } = "free";      // free
    public int TripQuotaUsed { get; set; }           // ใช้ไปกี่ทริป

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public List<User> Users { get; set; } = [];
    public List<TripPlan> Trips { get; set; } = [];
    public List<Post> Posts { get; set; } = [];
}
```

#### mst_users

```csharp
public class User
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Owner;  // Owner, Editor
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public Company Company { get; set; } = null!;
}
```

#### mst_staff_users

```csharp
public class StaffUser
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public StaffRole Role { get; set; }                // Admin, Support, Viewer
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

#### trip_plans

```csharp
public class TripPlan
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }                   // unique, SEO-friendly
    public string Destination { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string? CoverImageUrl { get; set; }
    public int TravelersCount { get; set; }
    public Language Language { get; set; } = Language.Thai;
    public TripStatus Status { get; set; } = TripStatus.Draft;

    // JSONB columns
    public List<AirlineInfo> AirlineInfo { get; set; } = [];
    public List<Accommodation> Accommodations { get; set; } = [];
    public List<EmergencyContact> EmergencyContacts { get; set; } = [];
    public string? ImportantNotes { get; set; }

    // Counters
    public int EditCount { get; set; }
    public int ViewCount { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public Company Company { get; set; } = null!;
    public List<TripDay> Days { get; set; } = [];
    public List<Follower> Followers { get; set; } = [];
    public List<ChangeLog> ChangeLogs { get; set; } = [];
}
```

#### trip_days

```csharp
public class TripDay
{
    public Guid Id { get; set; }
    public Guid TripId { get; set; }
    public int DayNumber { get; set; }
    public string Title { get; set; } = string.Empty;       // "Day 1"
    public string? Subtitle { get; set; }                    // "วันเดินทาง — กรุงเทพฯ → โตเกียว"
    public string? CoverImageUrl { get; set; }
    public DateOnly? Date { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public TripPlan Trip { get; set; } = null!;
    public List<TripActivity> Activities { get; set; } = [];
}
```

#### trip_activities

```csharp
public class TripActivity
{
    public Guid Id { get; set; }
    public Guid DayId { get; set; }
    public string? Time { get; set; }                       // "09:00"
    public string Name { get; set; } = string.Empty;        // "วัดอรุณ"
    public string? Description { get; set; }                 // หมายเหตุ
    public ActivityType Type { get; set; } = ActivityType.Attraction;
    public string? PlaceName { get; set; }
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public string? MapsLink { get; set; }                   // Google Maps URL
    public string? ImageUrl { get; set; }
    public string? Emoji { get; set; }                      // "🏛️"
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public TripDay Day { get; set; } = null!;
}
```

#### trip_posts

```csharp
public class Post
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Destination { get; set; }
    public string? Description { get; set; }
    public string? Highlights { get; set; }                 // Rich text
    public List<string> Images { get; set; } = [];          // JSONB
    public decimal? Price { get; set; }
    public string? Duration { get; set; }                   // "3 วัน 2 คืน"
    public string? TravelPeriod { get; set; }               // "เม.ย. - พ.ค. 2569"
    public int? Slots { get; set; }
    public List<string> Tags { get; set; } = [];            // JSONB
    public PostStatus Status { get; set; } = PostStatus.Draft;
    public int ViewCount { get; set; }
    public int InquiryCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public Company Company { get; set; } = null!;
}
```

#### noti_followers

```csharp
public class Follower
{
    public Guid Id { get; set; }
    public Guid TripId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public FollowChannel Channel { get; set; }              // Line, WebPush
    public string? LineUserId { get; set; }
    public WebPushSubscription? WebPushSubscription { get; set; }  // JSONB
    public DateTime FollowedAt { get; set; }

    // Navigation
    public TripPlan Trip { get; set; } = null!;
    public List<Acknowledgement> Acknowledgements { get; set; } = [];
}
```

#### noti_change_logs

```csharp
public class ChangeLog
{
    public Guid Id { get; set; }
    public Guid TripId { get; set; }
    public Guid ChangedBy { get; set; }                     // User ID
    public List<ChangeEntry> Changes { get; set; } = [];    // JSONB
    public string SummaryText { get; set; } = string.Empty; // Human-readable
    public bool NotiSent { get; set; }
    public DateTime? NotiSentAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public TripPlan Trip { get; set; } = null!;
    public List<Acknowledgement> Acknowledgements { get; set; } = [];
}
```

#### noti_acknowledgements

```csharp
public class Acknowledgement
{
    public Guid Id { get; set; }
    public Guid ChangeLogId { get; set; }
    public Guid FollowerId { get; set; }
    public DateTime AcknowledgedAt { get; set; }

    // Navigation
    public ChangeLog ChangeLog { get; set; } = null!;
    public Follower Follower { get; set; } = null!;
}
```

### 3.3 JSONB Column Types

```csharp
// TripApp.Models/JsonModels/AirlineInfo.cs
public class AirlineInfo
{
    public string Airline { get; set; } = string.Empty;        // "Thai Airways"
    public string FlightNumber { get; set; } = string.Empty;   // "TG104"
    public string DepartureTime { get; set; } = string.Empty;  // "17:40"
    public string ArrivalTime { get; set; } = string.Empty;    // "22:05"
    public string? DepartureAirport { get; set; }              // "BKK"
    public string? ArrivalAirport { get; set; }                // "NRT"
    public string Type { get; set; } = "departure";            // departure, return
}

// TripApp.Models/JsonModels/Accommodation.cs
public class Accommodation
{
    public string Name { get; set; } = string.Empty;           // "The QUBE Hotel Chiba"
    public string? Address { get; set; }                       // "1-2-3 Chiba, Japan"
    public string? Phone { get; set; }                         // "+81-43-xxx"
    public string? CheckIn { get; set; }                       // "15:00"
    public string? CheckOut { get; set; }                      // "11:00"
    public int? Nights { get; set; }                           // 5
}

// TripApp.Models/JsonModels/EmergencyContact.cs
public class EmergencyContact
{
    public string Name { get; set; } = string.Empty;           // "สถานทูตไทย"
    public string Phone { get; set; } = string.Empty;          // "+81-3-xxxx"
    public string? Icon { get; set; }                          // "🏥"
    public int SortOrder { get; set; }
}

// TripApp.Models/JsonModels/ChangeEntry.cs
public class ChangeEntry
{
    public string Type { get; set; } = string.Empty;           // "add", "update", "delete"
    public string Entity { get; set; } = string.Empty;         // "activity", "day"
    public int? DayNumber { get; set; }
    public string? Field { get; set; }                         // "time", "name"
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string Description { get; set; } = string.Empty;    // "เปลี่ยนเวลา teamLab: 08:30 → 09:00"
}

// TripApp.Models/JsonModels/WebPushSubscription.cs
public class WebPushSubscription
{
    public string Endpoint { get; set; } = string.Empty;
    public string P256dh { get; set; } = string.Empty;
    public string Auth { get; set; } = string.Empty;
}
```

### 3.4 Enums

```csharp
public enum AccountType   { Company, FreelanceGuide, Personal }
public enum TripStatus    { Draft, Published, Unpublished }
public enum PostStatus    { Draft, Published, Closed }
public enum ActivityType  { Attraction, Restaurant, Hotel, Transport, Shopping, Other }
public enum FollowChannel { Line, WebPush }
public enum UserRole      { Owner, Editor }
public enum StaffRole     { Admin, Support, Viewer }
public enum TicketStatus  { Open, Pending, Resolved, Closed }
public enum TicketType    { Bug, FeatureRequest, Question, Other }
public enum Language      { Thai, English, Japanese }
```

---

## 4. API Endpoints

### 4.1 Admin Endpoints — `/api/admin`

#### Auth

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| POST | `/api/admin/auth/register` | Anonymous | สมัครสมาชิก (email + password + company name + account type) |
| POST | `/api/admin/auth/login` | Anonymous | ล็อกอิน → ได้ JWT |
| POST | `/api/admin/auth/logout` | Admin | ล็อกเอาท์ (invalidate token) |
| GET | `/api/admin/auth/session` | Admin | ดึง session ปัจจุบัน |
| POST | `/api/admin/auth/refresh` | Admin | Refresh JWT token |

#### Company Profile

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/admin/company` | Admin | ดึงข้อมูลบริษัท |
| PUT | `/api/admin/company` | Admin | แก้ไข profile (ชื่อ, เบอร์, LINE, social links) |
| POST | `/api/admin/company/logo` | Admin | อัปโหลด logo (form-data) |

#### Trip Plans

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/admin/trips` | Admin | รายการทริปของบริษัท (filter: status, search) |
| POST | `/api/admin/trips` | Admin | สร้างทริปใหม่ (auto-generate days) |
| GET | `/api/admin/trips/{id}` | Admin | ดึงรายละเอียดทริป (include days + activities) |
| PUT | `/api/admin/trips/{id}` | Admin | แก้ไขข้อมูลทั่วไป + สร้าง change log |
| DELETE | `/api/admin/trips/{id}` | Admin (Owner) | ลบทริป (draft only) |
| POST | `/api/admin/trips/{id}/publish` | Admin (Owner) | เผยแพร่ → สร้าง slug + URL |
| POST | `/api/admin/trips/{id}/unpublish` | Admin (Owner) | ยกเลิกเผยแพร่ |

#### Days

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| POST | `/api/admin/trips/{tripId}/days` | Admin | เพิ่มวัน |
| PUT | `/api/admin/trips/{tripId}/days/{dayId}` | Admin | แก้ไขวัน |
| DELETE | `/api/admin/trips/{tripId}/days/{dayId}` | Admin | ลบวัน |
| PUT | `/api/admin/trips/{tripId}/days/reorder` | Admin | จัดลำดับวัน (drag-drop) |

#### Activities

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| POST | `/api/admin/days/{dayId}/activities` | Admin | เพิ่มกิจกรรม |
| PUT | `/api/admin/days/{dayId}/activities/{actId}` | Admin | แก้ไขกิจกรรม |
| DELETE | `/api/admin/days/{dayId}/activities/{actId}` | Admin | ลบกิจกรรม |
| PUT | `/api/admin/days/{dayId}/activities/reorder` | Admin | จัดลำดับ (drag-drop) |

#### Posts

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/admin/posts` | Admin | รายการ posts ของบริษัท |
| POST | `/api/admin/posts` | Admin | สร้าง post ใหม่ |
| GET | `/api/admin/posts/{id}` | Admin | ดึงรายละเอียด post |
| PUT | `/api/admin/posts/{id}` | Admin | แก้ไข post |
| DELETE | `/api/admin/posts/{id}` | Admin (Owner) | ลบ post (draft only) |
| PUT | `/api/admin/posts/{id}/status` | Admin | เปลี่ยนสถานะ (draft → published → closed) |

#### Notification & Read Receipt

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/admin/trips/{tripId}/followers` | Admin | รายชื่อ followers |
| GET | `/api/admin/trips/{tripId}/changelog` | Admin | ประวัติการเปลี่ยนแปลง |
| GET | `/api/admin/trips/{tripId}/changelog/{logId}/receipts` | Admin | read receipt detail |
| POST | `/api/admin/trips/{tripId}/notify/{logId}` | Admin | ส่ง notification ให้ followers |
| POST | `/api/admin/trips/{tripId}/notify/{logId}/resend` | Admin | ส่งซ้ำเฉพาะคนที่ยังไม่อ่าน |

#### Portfolio

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/admin/portfolio` | Admin | ดู portfolio settings |
| PUT | `/api/admin/portfolio` | Admin | เปิด/ปิด portfolio, แก้ slug |

#### Usage & Billing

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/admin/usage` | Admin | ดู quota (ทริปฟรี, ทริปที่ใช้ไป) |

#### Feedback

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| POST | `/api/admin/feedback` | Admin | ส่ง feedback/แจ้งปัญหา |

#### Upload

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| POST | `/api/admin/upload/image` | Admin | อัปโหลดรูป → Cloudflare R2 |

---

### 4.2 Client Endpoints — `/api/client`

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/client/t/{slug}` | Anonymous | ดึงข้อมูลทริป (public, SSR-ready) |
| GET | `/api/client/t/{slug}/imm` | Anonymous | ข้อมูลสำหรับ Immigration View |
| POST | `/api/client/t/{slug}/view` | Anonymous | นับ view count (+1) |
| POST | `/api/client/follow/web-push` | Anonymous | สมัคร Web Push (display_name + subscription) |
| DELETE | `/api/client/follow/{followerId}` | Anonymous | ยกเลิกติดตาม |
| POST | `/api/client/line/webhook` | LINE Signature | LINE webhook (follow/unfollow events) |
| POST | `/api/client/acknowledge/{changelogId}` | Anonymous | กดรับทราบ (follower_id ใน body) |
| GET | `/api/client/portfolio/{slug}` | Anonymous | ดู portfolio สาธารณะ |
| GET | `/api/client/posts` | Anonymous | รายการ posts สาธารณะ (สำหรับ Info Website) |
| GET | `/api/client/posts/{id}` | Anonymous | รายละเอียด post สาธารณะ |

---

### 4.3 Staff Endpoints — `/api/staff`

#### Auth & Dashboard

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| POST | `/api/staff/auth/login` | Anonymous | Staff login (แยก JWT audience) |
| GET | `/api/staff/auth/session` | Staff | ดึง staff session |
| GET | `/api/staff/dashboard` | Staff | ภาพรวมระบบ (total companies, trips, users, revenue) |

#### Company Management

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/staff/companies` | Staff | รายการบริษัททั้งหมด (search, filter, paginate) |
| GET | `/api/staff/companies/{id}` | Staff | รายละเอียดบริษัท + ทริป + posts |
| PUT | `/api/staff/companies/{id}` | Staff (Admin) | แก้ไขข้อมูลบริษัท |
| POST | `/api/staff/companies/{id}/verify` | Staff (Admin) | ยืนยัน TAT license |
| POST | `/api/staff/companies/{id}/suspend` | Staff (Admin) | ระงับบัญชี |
| POST | `/api/staff/companies/{id}/unsuspend` | Staff (Admin) | ปลดระงับ |

#### Trip Management

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/staff/trips` | Staff | ทริปทั้งระบบ (search, filter, paginate) |
| GET | `/api/staff/trips/{id}` | Staff | รายละเอียดทริป (view เหมือน builder) |
| POST | `/api/staff/trips/{id}/moderate` | Staff (Admin) | moderate เนื้อหา (flag/unflag) |

#### User Management

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/staff/users` | Staff | ผู้ใช้ทั้งหมด (search, filter, paginate) |
| GET | `/api/staff/users/{id}` | Staff | รายละเอียดผู้ใช้ |
| PUT | `/api/staff/users/{id}` | Staff (Admin) | แก้ไขข้อมูลผู้ใช้ |
| POST | `/api/staff/users/{id}/suspend` | Staff (Admin) | ระงับผู้ใช้ |

#### Post Management

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/staff/posts` | Staff | Posts ทั้งระบบ |
| GET | `/api/staff/posts/{id}` | Staff | รายละเอียด post |
| POST | `/api/staff/posts/{id}/moderate` | Staff (Admin) | moderate post |

#### Support Tickets

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/staff/support/tickets` | Staff | รายการ ticket ทั้งหมด (filter: status, type) |
| GET | `/api/staff/support/tickets/{id}` | Staff | รายละเอียด ticket + replies |
| PUT | `/api/staff/support/tickets/{id}` | Staff | อัปเดตสถานะ (Open → Pending → Resolved) |
| POST | `/api/staff/support/tickets/{id}/reply` | Staff | ตอบกลับ ticket |

#### Payment & Reports

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/staff/payments` | Staff | ประวัติการชำระเงินทั้งหมด |
| GET | `/api/staff/reports/analytics` | Staff | รายงานสรุป (companies, trips, revenue, growth) |
| POST | `/api/staff/reports/export` | Staff (Admin) | Export CSV |

#### Settings & Announcements

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/staff/settings/plans` | Staff | ดู pricing plans |
| PUT | `/api/staff/settings/plans` | Staff (Admin) | แก้ไข pricing plans |
| GET | `/api/staff/announcements` | Staff | รายการประกาศ |
| POST | `/api/staff/announcements` | Staff (Admin) | สร้างประกาศใหม่ |
| PUT | `/api/staff/announcements/{id}` | Staff (Admin) | แก้ไขประกาศ |

#### Staff Account Management

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/staff/members` | Staff (Admin) | รายการ staff ทั้งหมด |
| POST | `/api/staff/members` | Staff (Admin) | เพิ่ม staff ใหม่ |
| PUT | `/api/staff/members/{id}` | Staff (Admin) | แก้ไข staff |
| DELETE | `/api/staff/members/{id}` | Staff (Admin) | ลบ staff |

---

### 4.4 Health Check

| Method | Route | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/health` | Anonymous | API health status + DB connection |

---

## 5. Authentication & Authorization

### 5.1 JWT Configuration

```csharp
// Program.cs

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "trip-api",
            ValidateAudience = true,
            ValidAudiences = ["admin", "staff"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!)
            ),
        };
    });
```

### 5.2 Authorization Policies

```csharp
builder.Services.AddAuthorizationBuilder()
    // Admin: บริษัท/ไกด์/Personal ที่ login แล้ว
    .AddPolicy("AdminPolicy", policy =>
        policy.RequireClaim("aud", "admin")
              .RequireClaim("company_id"))

    // Admin Owner: เฉพาะ Owner (delete, publish, billing)
    .AddPolicy("AdminOwnerPolicy", policy =>
        policy.RequireClaim("aud", "admin")
              .RequireClaim("role", "owner"))

    // Staff: เจ้าหน้าที่ระบบ ทุก role
    .AddPolicy("StaffPolicy", policy =>
        policy.RequireClaim("aud", "staff"))

    // Staff Admin: เฉพาะ Admin (verify, suspend, settings)
    .AddPolicy("StaffAdminPolicy", policy =>
        policy.RequireClaim("aud", "staff")
              .RequireClaim("role", "admin"));
```

### 5.3 JWT Claims

#### Admin JWT

```json
{
  "sub": "user-uuid",
  "aud": "admin",
  "company_id": "company-uuid",
  "role": "owner",
  "account_type": "company",
  "name": "สมชาย",
  "email": "somchai@example.com",
  "iat": 1711800000,
  "exp": 1712404800
}
```

#### Staff JWT

```json
{
  "sub": "staff-uuid",
  "aud": "staff",
  "role": "admin",
  "name": "Admin Platform",
  "email": "admin@[your-domain.com]",
  "iat": 1711800000,
  "exp": 1711886400
}
```

### 5.4 Token Lifetime

| Token | Audience | Lifetime |
|---|---|---|
| Admin Access Token | admin | 7 วัน |
| Admin Refresh Token | admin | 30 วัน |
| Staff Access Token | staff | 24 ชั่วโมง |
| Staff Refresh Token | staff | 7 วัน |

### 5.5 Authorization Matrix

| Action | Admin Owner | Admin Editor | Staff Admin | Staff Support | Staff Viewer | Anonymous |
|---|---|---|---|---|---|---|
| Register / Login | — | — | — | — | — | ✅ |
| Create trip | ✅ | ✅ | — | — | — | — |
| Edit trip | ✅ | ✅ | — | — | — | — |
| Delete / Publish trip | ✅ | ❌ | — | — | — | — |
| Send notification | ✅ | ✅ | — | — | — | — |
| Edit company profile | ✅ | ❌ | — | — | — | — |
| View usage | ✅ | ✅ | — | — | — | — |
| Create / Edit post | ✅ | ✅ | — | — | — | — |
| Delete / Change status post | ✅ | ❌ | — | — | — | — |
| View published trip | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Follow trip | — | — | — | — | — | ✅ |
| Acknowledge change | — | — | — | — | — | ✅ |
| View all companies | — | — | ✅ | ✅ | ✅ | — |
| Verify / Suspend company | — | — | ✅ | ❌ | ❌ | — |
| Reply support ticket | — | — | ✅ | ✅ | ❌ | — |
| View reports | — | — | ✅ | ✅ | ✅ | — |
| Export data | — | — | ✅ | ❌ | ❌ | — |
| Manage settings | — | — | ✅ | ❌ | ❌ | — |
| Manage staff | — | — | ✅ | ❌ | ❌ | — |

---

## 6. Service Layer — Business Logic

### 6.1 หลักการ

- **Service = Business Logic** — controller ไม่มี logic
- **Interface-based** — ทุก service มี interface สำหรับ DI + testing
- **Company-scoped** — ทุก query ของ Admin ต้อง filter `WHERE company_id = :companyId`
- **Shared across controllers** — TripService ใช้ได้ทั้ง Admin, Client, Staff

### 6.2 ตัวอย่าง Service

#### TripService

```csharp
public interface ITripService
{
    // Admin
    Task<TripPlan> CreateAsync(Guid companyId, CreateTripRequest req);
    Task<List<TripPlan>> ListByCompanyAsync(Guid companyId, string? status, string? search);
    Task<TripPlan?> GetByIdAsync(Guid tripId, Guid companyId);
    Task<TripPlan> UpdateAsync(Guid tripId, Guid companyId, UpdateTripRequest req);
    Task DeleteAsync(Guid tripId, Guid companyId);
    Task<TripPlan> PublishAsync(Guid tripId, Guid companyId, string? customSlug);
    Task UnpublishAsync(Guid tripId, Guid companyId);

    // Client (public)
    Task<TripPlan?> GetBySlugAsync(string slug);
    Task<ImmigrationResponse?> GetImmigrationAsync(string slug);
    Task IncrementViewAsync(Guid tripId);

    // Staff
    Task<PaginatedResponse<TripPlan>> ListAllAsync(int page, int pageSize, string? search);
}
```

#### NotificationService

```csharp
public interface INotificationService
{
    Task SendToAllFollowersAsync(Guid changelogId);
    Task ResendToUnreadAsync(Guid changelogId);
}

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly ILineMessagingService _line;
    private readonly IWebPushService _webPush;

    public async Task SendToAllFollowersAsync(Guid changelogId)
    {
        var log = await _db.ChangeLogs
            .Include(l => l.Trip)
                .ThenInclude(t => t.Followers)
            .FirstOrDefaultAsync(l => l.Id == changelogId)
            ?? throw new NotFoundException("ChangeLog not found");

        var tasks = log.Trip.Followers.Select(follower => follower.Channel switch
        {
            FollowChannel.Line => _line.PushMessageAsync(
                follower.LineUserId!,
                BuildLineFlexMessage(log)),

            FollowChannel.WebPush => _webPush.SendAsync(
                follower.WebPushSubscription!,
                BuildWebPushPayload(log)),

            _ => Task.CompletedTask
        });

        await Task.WhenAll(tasks);

        log.NotiSent = true;
        log.NotiSentAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task ResendToUnreadAsync(Guid changelogId)
    {
        var log = await _db.ChangeLogs
            .Include(l => l.Trip).ThenInclude(t => t.Followers)
            .Include(l => l.Acknowledgements)
            .FirstOrDefaultAsync(l => l.Id == changelogId)
            ?? throw new NotFoundException("ChangeLog not found");

        var acknowledgedIds = log.Acknowledgements.Select(a => a.FollowerId).ToHashSet();
        var unreadFollowers = log.Trip.Followers
            .Where(f => !acknowledgedIds.Contains(f.Id))
            .ToList();

        var tasks = unreadFollowers.Select(follower => follower.Channel switch
        {
            FollowChannel.Line => _line.PushMessageAsync(
                follower.LineUserId!,
                BuildLineFlexMessage(log)),
            FollowChannel.WebPush => _webPush.SendAsync(
                follower.WebPushSubscription!,
                BuildWebPushPayload(log)),
            _ => Task.CompletedTask
        });

        await Task.WhenAll(tasks);
    }
}
```

#### ChangeLogService

```csharp
public interface IChangeLogService
{
    List<ChangeEntry> DetectChanges(TripPlan before, UpdateTripRequest after);
    Task<ChangeLog> CreateAsync(Guid tripId, Guid userId, List<ChangeEntry> changes);
    Task<List<ChangeLog>> GetHistoryAsync(Guid tripId, Guid companyId);
    Task<ReadReceiptResponse> GetReadReceiptsAsync(Guid changelogId, Guid companyId);
}
```

### 6.3 DI Registration

```csharp
// TripApp.API/Extensions/ServiceCollectionExtensions.cs

public static IServiceCollection AddAppServices(this IServiceCollection services)
{
    // Services
    services.AddScoped<IAuthService, AuthService>();
    services.AddScoped<ICompanyService, CompanyService>();
    services.AddScoped<ITripService, TripService>();
    services.AddScoped<IDayService, DayService>();
    services.AddScoped<IActivityService, ActivityService>();
    services.AddScoped<IPostService, PostService>();
    services.AddScoped<IPublishService, PublishService>();
    services.AddScoped<IFollowService, FollowService>();
    services.AddScoped<INotificationService, NotificationService>();
    services.AddScoped<IChangeLogService, ChangeLogService>();
    services.AddScoped<IAcknowledgeService, AcknowledgeService>();
    services.AddScoped<IUploadService, UploadService>();
    services.AddScoped<IAnalyticsService, AnalyticsService>();
    services.AddScoped<IPortfolioService, PortfolioService>();
    services.AddScoped<ISupportService, SupportService>();

    // External services
    services.AddScoped<ILineMessagingService, LineMessagingService>();
    services.AddScoped<IWebPushService, WebPushService>();

    return services;
}
```

---

## 7. Controller Pattern

### 7.1 หลักการ — Controller เป็น Thin Wrapper

ทุก controller ทำแค่ 3 อย่าง:

```
1. Auth    → ตรวจสอบสิทธิ์ (ผ่าน [Authorize] attribute)
2. Validate → ตรวจสอบ input (ผ่าน Model Validation)
3. Call     → เรียก Service แล้ว return DTO
```

### 7.2 ตัวอย่าง Controller

#### Admin — TripController

```csharp
[ApiController]
[Route("api/admin/trips")]
[Authorize(Policy = "AdminPolicy")]
public class TripController : ControllerBase
{
    private readonly ITripService _tripService;

    public TripController(ITripService tripService)
    {
        _tripService = tripService;
    }

    /// <summary>รายการทริปของบริษัท</summary>
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        var companyId = User.GetCompanyId();
        var trips = await _tripService.ListByCompanyAsync(companyId, status, search);
        return Ok(ApiResponse.Ok(trips.Select(t => t.ToListResponse())));
    }

    /// <summary>สร้างทริปใหม่</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTripRequest req)
    {
        var companyId = User.GetCompanyId();
        var trip = await _tripService.CreateAsync(companyId, req);
        return Created($"api/admin/trips/{trip.Id}", ApiResponse.Ok(trip.ToResponse()));
    }

    /// <summary>ดึงรายละเอียดทริป</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var companyId = User.GetCompanyId();
        var trip = await _tripService.GetByIdAsync(id, companyId);
        if (trip is null) return NotFound(ApiResponse.Error("Trip not found"));
        return Ok(ApiResponse.Ok(trip.ToDetailResponse()));
    }

    /// <summary>แก้ไขทริป</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTripRequest req)
    {
        var companyId = User.GetCompanyId();
        var trip = await _tripService.UpdateAsync(id, companyId, req);
        return Ok(ApiResponse.Ok(trip.ToResponse()));
    }

    /// <summary>ลบทริป (draft only)</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOwnerPolicy")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var companyId = User.GetCompanyId();
        await _tripService.DeleteAsync(id, companyId);
        return Ok(ApiResponse.Ok("Trip deleted"));
    }

    /// <summary>เผยแพร่ทริป</summary>
    [HttpPost("{id:guid}/publish")]
    [Authorize(Policy = "AdminOwnerPolicy")]
    public async Task<IActionResult> Publish(Guid id, [FromBody] PublishRequest? req = null)
    {
        var companyId = User.GetCompanyId();
        var trip = await _tripService.PublishAsync(id, companyId, req?.CustomSlug);
        return Ok(ApiResponse.Ok(new PublishResponse
        {
            Slug = trip.Slug!,
            Url = $"https://[your-domain.com]/t/{trip.Slug}",
            PublishedAt = trip.PublishedAt!.Value
        }));
    }
}
```

#### Client — TripPublicController

```csharp
[ApiController]
[Route("api/client")]
public class TripPublicController : ControllerBase
{
    private readonly ITripService _tripService;
    private readonly IAnalyticsService _analytics;

    public TripPublicController(ITripService tripService, IAnalyticsService analytics)
    {
        _tripService = tripService;
        _analytics = analytics;
    }

    /// <summary>ดึงข้อมูลทริป (public)</summary>
    [HttpGet("t/{slug}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var trip = await _tripService.GetBySlugAsync(slug);
        if (trip is null) return NotFound(ApiResponse.Error("Trip not found"));
        await _analytics.IncrementViewAsync(trip.Id);
        return Ok(ApiResponse.Ok(trip.ToPublicResponse()));
    }

    /// <summary>ข้อมูลสำหรับ Immigration View</summary>
    [HttpGet("t/{slug}/imm")]
    [AllowAnonymous]
    public async Task<IActionResult> GetImmigration(string slug)
    {
        var data = await _tripService.GetImmigrationAsync(slug);
        if (data is null) return NotFound(ApiResponse.Error("Trip not found"));
        return Ok(ApiResponse.Ok(data));
    }

    /// <summary>นับ view</summary>
    [HttpPost("t/{slug}/view")]
    [AllowAnonymous]
    public async Task<IActionResult> TrackView(string slug)
    {
        var trip = await _tripService.GetBySlugAsync(slug);
        if (trip is null) return NotFound();
        await _analytics.IncrementViewAsync(trip.Id);
        return Ok();
    }
}
```

#### Staff — CompanyMgmtController

```csharp
[ApiController]
[Route("api/staff/companies")]
[Authorize(Policy = "StaffPolicy")]
public class CompanyMgmtController : ControllerBase
{
    private readonly ICompanyService _companyService;

    public CompanyMgmtController(ICompanyService companyService)
    {
        _companyService = companyService;
    }

    /// <summary>รายการบริษัททั้งระบบ</summary>
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? accountType = null)
    {
        var result = await _companyService.ListAllAsync(page, pageSize, search, accountType);
        return Ok(ApiResponse.Ok(result));
    }

    /// <summary>ยืนยัน TAT license</summary>
    [HttpPost("{id:guid}/verify")]
    [Authorize(Policy = "StaffAdminPolicy")]
    public async Task<IActionResult> Verify(Guid id, [FromBody] VerifyCompanyRequest req)
    {
        await _companyService.VerifyAsync(id, req);
        return Ok(ApiResponse.Ok("Company verified"));
    }

    /// <summary>ระงับบัญชี</summary>
    [HttpPost("{id:guid}/suspend")]
    [Authorize(Policy = "StaffAdminPolicy")]
    public async Task<IActionResult> Suspend(Guid id)
    {
        await _companyService.SuspendAsync(id);
        return Ok(ApiResponse.Ok("Company suspended"));
    }
}
```

---

## 8. API Response Format

### 8.1 Standard Response Wrapper

```csharp
// TripApp.Models/DTOs/Common/ApiResponse.cs

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Error { get; set; }
    public string? TraceId { get; set; }

    public static ApiResponse<T> Ok(T data) => new() { Success = true, Data = data };
    public static ApiResponse<T> Fail(string error) => new() { Success = false, Error = error };
}

public class PaginatedResponse<T>
{
    public List<T> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasNext => Page < TotalPages;
    public bool HasPrevious => Page > 1;
}
```

### 8.2 Response Examples

#### Success

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "ทริปโตเกียว 2569",
    "slug": "tokyo-2569",
    "status": "published",
    "viewCount": 42,
    "followerCount": 18
  }
}
```

#### Success (Paginated)

```json
{
  "success": true,
  "data": {
    "items": [
      { "id": "...", "title": "ทริปโตเกียว", "status": "published" },
      { "id": "...", "title": "ทริปเชียงใหม่", "status": "draft" }
    ],
    "totalCount": 25,
    "page": 1,
    "pageSize": 20,
    "totalPages": 2,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

#### Error

```json
{
  "success": false,
  "error": "Trip not found",
  "traceId": "0HN4RQJP1E1V2:00000001"
}
```

#### Validation Error (422)

```json
{
  "success": false,
  "error": "Validation failed",
  "traceId": "0HN4RQJP1E1V2:00000002",
  "data": {
    "errors": {
      "Title": ["Title is required"],
      "StartDate": ["Start date must be in the future"]
    }
  }
}
```

---

## 9. Middleware Pipeline

### 9.1 Pipeline Order

```csharp
// Program.cs

var app = builder.Build();

// 1. Global Exception Handler
app.UseMiddleware<ExceptionMiddleware>();

// 2. Request Logging
app.UseMiddleware<RequestLoggingMiddleware>();

// 3. CORS
app.UseCors("AppCors");

// 4. Rate Limiting
app.UseRateLimiter();

// 5. Authentication
app.UseAuthentication();

// 6. Authorization
app.UseAuthorization();

// 7. Controllers
app.MapControllers();

// 8. Health Check
app.MapHealthChecks("/api/health");

app.Run();
```

### 9.2 CORS Configuration

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AppCors", policy =>
    {
        policy.WithOrigins(
                "https://admin.[your-domain.com]",    // Admin frontend
                "https://[your-domain.com]",           // Client frontend
                "https://staff.[your-domain.com]",     // Staff frontend
                "https://www.[your-domain.com]"        // Info website
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
```

### 9.3 Rate Limiting

```csharp
builder.Services.AddRateLimiter(options =>
{
    // Auth endpoints: 5 req / 15 min
    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(15);
        opt.PermitLimit = 5;
        opt.QueueLimit = 0;
    });

    // Admin write endpoints: 60 req / 1 min
    options.AddFixedWindowLimiter("admin-write", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 60;
        opt.QueueLimit = 5;
    });

    // Client public endpoints: 300 req / 1 min
    options.AddFixedWindowLimiter("client-read", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 300;
        opt.QueueLimit = 10;
    });

    // Notification: 10 req / 1 min
    options.AddFixedWindowLimiter("notify", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 10;
        opt.QueueLimit = 0;
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});
```

### 9.4 Exception Handling

```csharp
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (NotFoundException ex)
        {
            context.Response.StatusCode = 404;
            await context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail(ex.Message));
        }
        catch (ForbiddenException ex)
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail(ex.Message));
        }
        catch (BadRequestException ex)
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail(ex.Message));
        }
        catch (QuotaExceededException ex)
        {
            context.Response.StatusCode = 402;
            await context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(
                ApiResponse<object>.Fail("Internal server error"));
        }
    }
}
```

---

## 10. Security

### 10.1 Security Headers

```csharp
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Strict-Transport-Security",
        "max-age=63072000; includeSubDomains");
    context.Response.Headers.Append("Permissions-Policy",
        "camera=(), microphone=(), geolocation=()");
    await next();
});
```

### 10.2 LINE Webhook Signature Verification

```csharp
public class LineMessagingService : ILineMessagingService
{
    public bool VerifySignature(string body, string signature, string channelSecret)
    {
        var key = Encoding.UTF8.GetBytes(channelSecret);
        var bodyBytes = Encoding.UTF8.GetBytes(body);

        using var hmac = new HMACSHA256(key);
        var hash = hmac.ComputeHash(bodyBytes);
        var computed = Convert.ToBase64String(hash);

        return computed == signature;
    }
}
```

### 10.3 Password Hashing

```csharp
// ใช้ BCrypt.Net-Next
public class AuthService : IAuthService
{
    public string HashPassword(string password)
        => BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);

    public bool VerifyPassword(string password, string hash)
        => BCrypt.Net.BCrypt.Verify(password, hash);
}
```

### 10.4 Input Validation (Data Annotations)

```csharp
public class CreateTripRequest
{
    [Required(ErrorMessage = "Title is required")]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Destination is required")]
    [StringLength(200)]
    public string Destination { get; set; } = string.Empty;

    [Required]
    public DateOnly StartDate { get; set; }

    [Required]
    public DateOnly EndDate { get; set; }

    [Range(1, 200)]
    public int TravelersCount { get; set; } = 1;

    public string? Language { get; set; }
    public List<AirlineInfo>? AirlineInfo { get; set; }
    public List<Accommodation>? Accommodations { get; set; }
    public List<EmergencyContact>? EmergencyContacts { get; set; }
    public string? ImportantNotes { get; set; }
}
```

---

## 11. External Services

### 11.1 LINE Messaging API

```csharp
public interface ILineMessagingService
{
    bool VerifySignature(string body, string signature, string channelSecret);
    Task PushMessageAsync(string lineUserId, object message);
    Task ReplyMessageAsync(string replyToken, object message);
}
```

**Configuration:**

```json
{
  "Line": {
    "ChannelId": "...",
    "ChannelSecret": "...",
    "ChannelAccessToken": "...",
    "WebhookUrl": "https://api.[your-domain.com]/api/client/line/webhook"
  }
}
```

### 11.2 Web Push

```csharp
public interface IWebPushService
{
    Task SendAsync(WebPushSubscription subscription, object payload);
}
```

**Configuration:**

```json
{
  "WebPush": {
    "VapidPublicKey": "...",
    "VapidPrivateKey": "...",
    "VapidSubject": "mailto:support@[your-domain.com]"
  }
}
```

### 11.3 Cloudflare R2 (S3-Compatible)

```csharp
public interface IUploadService
{
    Task<string> UploadImageAsync(IFormFile file, string folder);
    Task DeleteImageAsync(string url);
}
```

**Configuration:**

```json
{
  "R2": {
    "AccountId": "...",
    "AccessKeyId": "...",
    "SecretAccessKey": "...",
    "BucketName": "trip-uploads",
    "PublicUrl": "https://cdn.[your-domain.com]"
  }
}
```

**Upload Path Convention:**

```
company-logos/{company_id}/{filename}.webp     ← Max 2 MB
trip-covers/{trip_id}/{filename}.webp          ← Max 5 MB
day-covers/{day_id}/{filename}.webp            ← Max 5 MB
post-images/{post_id}/{filename}.webp          ← Max 5 MB
```

---

## 12. Deployment

### 12.1 Infrastructure

```
┌─────── Vercel ───────────────────────────────────────────┐
│  apps/admin   → admin.[your-domain.com]                         │
│  apps/client  → [your-domain.com]                               │
│  apps/staff   → staff.[your-domain.com]                         │
│  apps/info    → www.[your-domain.com]                           │
└──────────────────────────────────────────────────────────┘
         │  HTTPS API calls
         ▼
┌─────── VPS (Docker Compose) ─────────────────────────────┐
│                                                           │
│  ┌──────────────────────────┐                            │
│  │  Nginx                    │  :443 (TLS)               │
│  │  api.[your-domain.com]           │                            │
│  └────────────┬─────────────┘                            │
│               │                                           │
│  ┌────────────▼─────────────┐                            │
│  │  TripApp.API               │  :5000                    │
│  │  ASP.NET Core 9           │                            │
│  │  Docker container         │                            │
│  └────────────┬─────────────┘                            │
│               │                                           │
│  ┌────────────▼─────────────┐                            │
│  │  PostgreSQL 16            │  :5432                    │
│  │  Docker container         │                            │
│  │  Volume: pgdata           │                            │
│  └──────────────────────────┘                            │
│                                                           │
│  Cron: pg_dump daily → Cloudflare R2 backup              │
└──────────────────────────────────────────────────────────┘
```

### 12.2 Docker Compose

```yaml
# docker/docker-compose.yml

services:
  api:
    build:
      context: ../
      dockerfile: docker/Dockerfile
    ports:
      - "5000:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=tripapp;Username=tripapp;Password=${DB_PASSWORD}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: tripapp
      POSTGRES_USER: tripapp
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tripapp"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  pgdata:
```

### 12.3 Dockerfile

```dockerfile
# docker/Dockerfile

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY src/TripApp.Models/TripApp.Models.csproj TripApp.Models/
COPY src/TripApp.Data/TripApp.Data.csproj TripApp.Data/
COPY src/TripApp.Services/TripApp.Services.csproj TripApp.Services/
COPY src/TripApp.API/TripApp.API.csproj TripApp.API/
RUN dotnet restore TripApp.API/TripApp.API.csproj

COPY src/ .
RUN dotnet publish TripApp.API/TripApp.API.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "TripApp.API.dll"]
```

### 12.4 Environment Variables

```env
# Database
ConnectionStrings__DefaultConnection=Host=postgres;Database=tripapp;Username=tripapp;Password=xxx

# JWT
Jwt__Secret=your-256-bit-secret-key-here-min-32-chars
Jwt__Issuer=trip-api

# LINE Messaging API
Line__ChannelId=xxx
Line__ChannelSecret=xxx
Line__ChannelAccessToken=xxx

# Web Push
WebPush__VapidPublicKey=xxx
WebPush__VapidPrivateKey=xxx
WebPush__VapidSubject=mailto:support@[your-domain.com]

# Cloudflare R2
R2__AccountId=xxx
R2__AccessKeyId=xxx
R2__SecretAccessKey=xxx
R2__BucketName=trip-uploads
R2__PublicUrl=https://cdn.[your-domain.com]

# App
App__BaseUrl=https://api.[your-domain.com]
App__FrontendUrls=https://admin.[your-domain.com],https://[your-domain.com],https://staff.[your-domain.com],https://www.[your-domain.com]
```

---

## 13. NuGet Packages

```xml
<!-- TripApp.API -->
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.0.*" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="7.*" />
<PackageReference Include="AspNetCoreRateLimit" Version="5.*" />

<!-- TripApp.Services -->
<PackageReference Include="BCrypt.Net-Next" Version="4.*" />
<PackageReference Include="AWSSDK.S3" Version="3.*" />
<PackageReference Include="WebPush" Version="2.*" />
<PackageReference Include="QRCoder" Version="1.*" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.*" />

<!-- TripApp.Data -->
<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="9.*" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="9.*" />

<!-- TripApp.Models -->
<!-- No external packages — pure C# classes -->
```

---

## 14. สรุปสถาปัตยกรรม

### Single API — 3 Route Prefixes

```
TripApp.API (ASP.NET Core 9)
│
├── /api/admin/*   ← 11 Controllers, ~35 endpoints
│   Auth: JWT (audience: admin)
│   ผู้ใช้: บริษัททัวร์ / ไกด์ / Personal
│
├── /api/client/*  ← 6 Controllers, ~10 endpoints
│   Auth: Anonymous (ส่วนใหญ่)
│   ผู้ใช้: ลูกทริป (Guest / Follower)
│
├── /api/staff/*   ← 11 Controllers, ~30 endpoints
│   Auth: JWT (audience: staff)
│   ผู้ใช้: เจ้าหน้าที่ระบบ
│
└── /api/health    ← Health check
```

### ข้อดีหลัก

| ประเด็น | ผลลัพธ์ |
|---|---|
| **1 API deploy** | จัดการง่าย สำหรับทีม 1-2 คน |
| **Shared services** | Business logic เขียนครั้งเดียว |
| **Company-scoped** | ทุก Admin query filter ด้วย company_id |
| **Type-safe** | C# + EF Core + JSONB = strong typing ตลอด pipeline |
| **Scalable** | เริ่ม VPS เดียว → แยก service ทีหลังได้ |
| **Cost-effective** | VPS ~200-300 บ/เดือน + Vercel ฟรี |

### Monthly Cost (MVP)

| Service | Cost |
|---|---|
| VPS (1 vCPU, 1 GB RAM) | ~200-300 บ/เดือน |
| Vercel (4 frontends) | ฟรี |
| Cloudflare R2 (10 GB) | ฟรี |
| LINE OA (500 msg) | ฟรี |
| Domain ([your-domain.com]) | ~400 บ/ปี |
| **Total** | **~250-350 บ/เดือน** |

---

*Document End — API Architecture v1.0*
