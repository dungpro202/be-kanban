// import { PrismaClient, Priority, Role } from 'src/generated/prisma/client';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('🌱 Starting seeding...');

//   // 1. CLEANUP (Xóa dữ liệu cũ theo thứ tự để tránh lỗi khóa ngoại Foreign Key)
//   console.log('🧹 Cleaning up old data...');
//   await prisma.activityLog.deleteMany();
//   await prisma.attachment.deleteMany();
//   await prisma.comment.deleteMany();
//   await prisma.taskLabel.deleteMany();
//   await prisma.task.deleteMany();
//   await prisma.column.deleteMany();
//   await prisma.label.deleteMany();
//   await prisma.boardMember.deleteMany();
//   await prisma.board.deleteMany();
//   await prisma.user.deleteMany();

//   // 2. CREATE USERS
//   console.log('👤 Creating users...');
  
//   // Mật khẩu demo (Lưu ý: Trong thực tế bạn cần hash password bằng bcrypt)
//   const passwordHash = 'password123'; 

//   const alice = await prisma.user.create({
//     data: {
//       email: 'alice@example.com',
//       name: 'Alice Manager',
//       password: passwordHash,
//       avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
//     },
//   });

//   const bob = await prisma.user.create({
//     data: {
//       email: 'bob@example.com',
//       name: 'Bob Developer',
//       password: passwordHash,
//       avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
//     },
//   });

//   const charlie = await prisma.user.create({
//     data: {
//       email: 'charlie@example.com',
//       name: 'Charlie Designer',
//       password: passwordHash,
//       avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
//     },
//   });

//   // 3. CREATE BOARD
//   console.log('📋 Creating board...');
//   const board = await prisma.board.create({
//     data: {
//       title: 'Project Kanban MVP',
//       description: 'Dự án quản lý công việc cá nhân và đội nhóm',
//       ownerId: alice.id,
//       // Thêm Labels mặc định cho board
//       labels: {
//         create: [
//           { name: 'Bug', color: '#ef4444' },      // Red
//           { name: 'Feature', color: '#3b82f6' },  // Blue
//           { name: 'Design', color: '#10b981' },   // Green
//           { name: 'Urgent', color: '#f59e0b' },   // Orange
//         ],
//       },
//     },
//   });

//   // 4. ADD MEMBERS
//   console.log('🤝 Adding members...');
//   await prisma.boardMember.createMany({
//     data: [
//       { boardId: board.id, userId: bob.id, role: Role.ADMIN },
//       { boardId: board.id, userId: charlie.id, role: Role.MEMBER },
//     ],
//   });

//   // 5. CREATE COLUMNS
//   console.log('🏗️ Creating columns...');
//   const colTodo = await prisma.column.create({
//     data: { title: 'To Do', position: 0, boardId: board.id },
//   });

//   const colProgress = await prisma.column.create({
//     data: { title: 'In Progress', position: 1, boardId: board.id },
//   });

//   const colDone = await prisma.column.create({
//     data: { title: 'Done', position: 2, boardId: board.id },
//   });

//   // Lấy Labels ra để gán vào Task
//   const labels = await prisma.label.findMany({ where: { boardId: board.id } });
//   const bugLabel = labels.find((l) => l.name === 'Bug');
//   const featureLabel = labels.find((l) => l.name === 'Feature');
//   const designLabel = labels.find((l) => l.name === 'Design');

//   // 6. CREATE TASKS
//   console.log('📝 Creating tasks...');

//   // Task 1: Setup Project (Done)
//   await prisma.task.create({
//     data: {
//       title: 'Khởi tạo NestJS Project',
//       description: 'Cài đặt NestJS, cấu hình Prisma và Docker',
//       columnId: colDone.id,
//       priority: Priority.HIGH,
//       assigneeId: bob.id,
//       position: 0,
//       labels: {
//         create: featureLabel ? [{ labelId: featureLabel.id }] : [],
//       },
//     },
//   });

//   // Task 2: Design Database (In Progress)
//   const taskDesign = await prisma.task.create({
//     data: {
//       title: 'Thiết kế Schema Database',
//       description: 'Vẽ ERD và chốt các quan hệ bảng User, Board, Task',
//       columnId: colProgress.id,
//       priority: Priority.HIGH,
//       assigneeId: alice.id,
//       position: 0,
//       dueDate: new Date(new Date().setDate(new Date().getDate() + 2)), // Due in 2 days
//       labels: {
//         create: designLabel ? [{ labelId: designLabel.id }] : [],
//       },
//     },
//   });

//   // Task 3: Login Bug (To Do)
//   const taskBug = await prisma.task.create({
//     data: {
//       title: 'Fix lỗi đăng nhập không nhận token',
//       columnId: colTodo.id,
//       priority: Priority.HIGH,
//       assigneeId: bob.id,
//       position: 0,
//       labels: {
//         create: bugLabel ? [{ labelId: bugLabel.id }] : [],
//       },
//     },
//   });

//   // Task 4: UI Homepage (To Do)
//   await prisma.task.create({
//     data: {
//       title: 'Code giao diện trang chủ',
//       columnId: colTodo.id,
//       priority: Priority.MEDIUM,
//       assigneeId: charlie.id,
//       position: 1,
//       labels: {
//         create: designLabel ? [{ labelId: designLabel.id }] : [],
//       },
//     },
//   });

//   // 7. CREATE COMMENTS & LOGS
//   console.log('💬 Adding comments...');
  
//   await prisma.comment.create({
//     data: {
//       content: 'Cần check kỹ phần quan hệ Many-to-Many nhé',
//       taskId: taskDesign.id,
//       userId: bob.id,
//     },
//   });

//   await prisma.activityLog.create({
//     data: {
//       action: 'MOVED_TASK',
//       metadata: { from: 'To Do', to: 'In Progress' },
//       boardId: board.id,
//       taskId: taskDesign.id,
//       userId: alice.id,
//     },
//   });

//   console.log('✅ Seeding finished.');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });