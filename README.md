# **Reporting System**

## **Overview**
This project introduces a streamlined reporting mechanism to enhance user experience and optimize workflows for accessing test reports. 
The solution integrates automation, secure user management, and centralized data storage, enabling clients 
to efficiently access their reports while reducing staff manual efforts.

### **Key Features**
- **Automated Notifications:** Sends email alerts to clients when new reports are uploaded, reducing delays and communication overhead.
- **Centralized Report Management:** Clients can log in to a secure account to download and manage all their reports from a unified dashboard.
- **Role-Based Access:** Provides tailored access for three user personas—General Public, Registered Clients, and Admin Staff.
- **Improved User Experience:** Intuitive interface for seamless navigation and report retrieval.

---

## **Architecture**
The system is built on a scalable and secure architecture with the following components:
- **Frontend:** PUG templates for dynamic HTML rendering.
- **Backend:** Built with **Node.js** and **Express.js** for robust API handling and server-side logic.
- **Database:** MySQL for secure and efficient data storage.
- **Cloud Integration:** Azure Storage for scalable and secure report file storage.

![Architecture Diagram](assets/architecture-image.png)


### **Components**
1. **Frontend:**
   - Dynamic rendering of client and admin portals.
   - Role-specific views and access controls.
2. **Backend Services:**
   - RESTful APIs for handling user authentication, report uploads, and notifications.
   - Secure integration with Azure Storage for report management.
3. **Database:**
   - User accounts, access roles, and metadata stored in a normalized MySQL database.
4. **Notification System:**
   - Email notifications triggered upon new report uploads using automated schedulers.

---

## **Integration Details**
- **Azure Storage:** Centralized location for securely storing uploaded test reports.
- **Email Service:** Automated email dispatch for real-time notifications.
- **Authentication:** Secure login for clients and admins using role-based access control.

---

## **User Roles**
1. **General Public:**
   - Access to general company information without login.
2. **Registered Clients:**
   - Login to download and manage reports.
   - Receive automated email notifications for new reports.
3. **Admin Staff:**
   - Upload and manage test reports.
   - Oversee user accounts and system operations.

---

## **Deployment and Scalability**
- **Platform:** Deployed on a Node.js server with integration to Azure Storage.
- **Scalability:** Supports growing user base with Azure's scalable cloud infrastructure.
- **Security:** Implements access control and encryption for secure data handling.
