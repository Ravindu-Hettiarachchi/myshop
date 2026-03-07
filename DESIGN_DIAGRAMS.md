# MyShop Platform Architecture Diagrams

This document contains key system architecture diagrams for the MyShop e-commerce SaaS platform, generated based on the database schema and system logic.

## 1. Entity Relationship Diagram (ERD)

This ERD visualizes the core PostgreSQL database schema tables (`owners`, `shops`, `products`, `orders`) and how they relate to one another via foreign keys.

```mermaid
erDiagram
    OWNER ||--o{ SHOP : "owns"
    SHOP ||--o{ PRODUCT : "contains"
    SHOP ||--o{ ORDER : "receives"

    OWNER {
        UUID id PK
        string email
        string full_name
        user_role role "Enum: admin, shop_owner, customer"
        datetime created_at
    }
    
    SHOP {
        UUID id PK
        UUID owner_id FK
        string shop_name
        string route_path "Unique Subdomain/Slug"
        boolean is_approved "Admin Toggle"
        string template
        string primary_color
        string font
        text logo_url
    }
    
    PRODUCT {
        UUID id PK
        UUID shop_id FK
        string title
        text description
        decimal price
        int stock_quantity
        int low_stock_threshold
        text[] image_urls
    }
    
    ORDER {
        UUID id PK
        UUID shop_id FK
        string customer_email
        decimal total_amount
        order_status status "Enum: processing, shipped, delivered"
        text invoice_url
    }
```

## 2. Use Case Diagram

This diagram maps the three primary actors (`Platform Admin`, `Shop Owner`, `Customer`) to their respective capabilities within the system perimeter.

```mermaid
flowchart LR
    %% Actors
    Admin((Platform Admin))
    Owner((Shop Owner))
    Customer((Customer))

    %% System Boundary
    subgraph "MyShop Platform Boundaries"
        direction TB
        %% Admin Actions
        UC1([Review & Approve Shops])
        UC2([Manage Platform Data])
        
        %% Owner Actions
        UC3([Onboard & Register Business])
        UC4([Customize Storefront Theme])
        UC5([Manage Inventory & Products])
        UC6([Track & Fulfill Orders])
        
        %% Customer Actions
        UC7([Browse Dynamic Storefronts])
        UC8([Place Orders securely])
    end

    %% Link Actors to Use Cases
    Admin --> UC1
    Admin --> UC2
    
    Owner --> UC3
    Owner --> UC4
    Owner --> UC5
    Owner --> UC6
    
    Customer --> UC7
    Customer --> UC8
```

## 3. Data Flow Diagram (DFD Level 0)

This Level 0 Data Flow (Context) Diagram illustrates the high-level flow of information between external entities and the core centralized MyShop engine.

```mermaid
flowchart TD
    classDef actor fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef system fill:#eff6ff,stroke:#3b82f6,stroke-width:3px;
    
    Cust[/Customer/]:::actor
    Own[/Shop Owner/]:::actor
    Adm[/Platform Admin/]:::actor
    
    Sys((MyShop\nSaaS Engine)):::system
    
    Cust -- "Web Requests (URL Routing)\nOrder Data & Payments" --> Sys
    Sys -- "Rendered HTML/CSS based on Theme\nStripe Receipts/Invoices" --> Cust
    
    Own -- "Shop Registration Data\nUploaded Logos/Assets\nProduct Inventory Creation" --> Sys
    Sys -- "Real-Time Sales Feeds\nLow-Stock Threshold Alerts\nAuthenticated Dashboard UI" --> Own
    
    Adm -- "Approval/Rejection Packets\nPlatform Metric Queries" --> Sys
    Sys -- "Pending Application Queues\nAggregated Platform Usage" --> Adm
```
