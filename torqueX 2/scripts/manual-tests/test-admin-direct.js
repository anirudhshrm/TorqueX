#!/usr/bin/env node

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const crypto = require('./src/utils/crypto');

// Simple test script to verify admin user creation and authentication
async function testAdminAccess() {
  console.log('🔍 Testing admin user access...');
  
  const prisma = new PrismaClient();
  
  try {
    // Check if admin user exists
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@torquex.com'
      }
    });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      hasPassword: !!adminUser.passwordHash
    });
    
    // Test password verification
    if (adminUser.passwordHash && adminUser.passwordSalt) {
      const isValidPassword = await crypto.verifyPassword('admin123', adminUser.passwordHash, adminUser.passwordSalt);
      console.log('🔐 Password verification:', isValidPassword ? 'SUCCESS' : 'FAILED');
    } else {
      console.log('⚠️ No password hash found for admin user');
    }
    
    // Test database queries that the dashboard would use
    console.log('\n📊 Testing dashboard queries...');
    
    try {
      const userCount = await prisma.user.count({ where: { role: 'USER' } });
      console.log('✅ User count query successful:', userCount);
    } catch (error) {
      console.log('❌ User count query failed:', error.message);
    }
    
    try {
      const vehicleCount = await prisma.vehicle.count();
      console.log('✅ Vehicle count query successful:', vehicleCount);
    } catch (error) {
      console.log('❌ Vehicle count query failed:', error.message);
    }
    
    try {
      const bookingCount = await prisma.booking.count();
      console.log('✅ Booking count query successful:', bookingCount);
    } catch (error) {
      console.log('❌ Booking count query failed:', error.message);
    }
    
    try {
      const vehicleTypes = await prisma.vehicle.groupBy({
        by: ['type'],
        _count: true
      });
      console.log('✅ Vehicle types query successful:', vehicleTypes.length, 'types');
    } catch (error) {
      console.log('❌ Vehicle types query failed:', error.message);
    }
    
    try {
      const recentBookings = await prisma.booking.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        include: {
          vehicle: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } }
        }
      });
      console.log('✅ Recent bookings query successful:', recentBookings.length, 'bookings');
    } catch (error) {
      console.log('❌ Recent bookings query failed:', error.message);
    }
    
    console.log('\n🎯 All checks completed!');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAdminAccess();