import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "nusrat.jahan@tuition-console.net";
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log("User not found!");
    return;
  }
  
  console.log("User role:", user.role);
  
  const passwordsToTest = [
    "tutorpassword123",
    "securepassword123",
    "adminpassword123"
  ];
  
  for (const pwd of passwordsToTest) {
    if (!user.password) {
        console.log("No password set!");
        break;
    }
    const isMatch = await bcrypt.compare(pwd, user.password);
    console.log(`Password '${pwd}' matches? ${isMatch}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
