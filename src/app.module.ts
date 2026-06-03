import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './infrastructure/database/typeorm.config';
import { AuthModule } from './modules/auth.module';
import { PetsModule } from './modules/pets.module';
import { PetPassModule } from './modules/pet-pass.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    PetsModule,
    PetPassModule,
  ],
})
export class AppModule {}
