# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Build iOS: `npm run ios`
- Build Android: `npm run android`
- Start Metro: `npm start`
- Lint: `npm run lint`
- Test all: `npm test`
- Test file: `npm test -- path/to/test.ts`
- Test specific: `npm test -- -t "test name"`

## Code Style
- **Architecture**: Clean architecture (domain/data/presentation)
- **Types**: Strong typing with explicit interfaces
- **Error handling**: Use AppError hierarchy with context
- **Classes**: PascalCase, one per file
- **Variables/functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Imports**: Group by source, named exports preferred
- **Testing**: Jest with describe/it blocks, clear descriptions
- **Components**: Use TypeScript React FC type
- **Error handling**: Always log errors and provide recovery options