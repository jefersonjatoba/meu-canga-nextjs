import { prisma } from './src/lib/prisma'

async function main() {
  const user = await prisma.user.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      cpf: '123.456.789-00',
      email: 'user@example.com',
      name: 'Test User',
      password: 'hashed_password_here',
    },
  })
  console.log('✅ User criado:', user.id, user.email)
}

main().catch(e => { console.error('Erro:', e.message); process.exit(1) }).finally(async () => await prisma.$disconnect())
