# SDD Progress — criar-convidar-grupo-familiar

Task 1: complete (backend pending-invites endpoint, no commit, review clean — Minor notes only: dto.ts missing trailing newline, dead-code ?? fallback inherited from spec, quote-style nit)
Task 2: complete (groups.service.ts rewritten, no commit, review clean — expected downstream tsc errors in 3 screen files not yet fixed)
Task 3: complete (usersService.search added, no commit, review clean)
Task 4: complete (CreateGroupScreen + CreateGroup/InviteMember route types + AppStack registration, no commit, review clean — Minor: import placed after GroupDetail import instead of EditProfile import, harmless)
Task 5: complete (InviteMemberScreen + AppStack registration, no commit, review clean — Minor UX quirks inherited verbatim from plan: stale resultados/success/selecionado not cleared on new search)
Task 6: complete (GroupDetailScreen.tsx fixed to nested types + convidar membro button, no commit, review clean)
Task 7: complete (GroupsScreen.tsx fixed + criar grupo action + real pending invites, no commit, review clean — Minor: no distinct signal when both allSettled branches fail, acceptable per spec)
Task 8: complete (ProfileScreen.tsx fixed, no commit, review clean — tsc --noEmit clean project-wide, chain done)
Final whole-feature review (opus): Approved, no Critical/Important findings. Minor: stale "Peça ao líder" copy in GroupsScreen.tsx + ProfileScreen.tsx (fixed directly, both now say "Peça pra alguém do grupo te convidar"). Both repos tsc --noEmit clean after fix.
Task 9: pending — requires user to manually test against running backend + device.

--- Plan 2: editar-deletar-conteudo-curso-evento ---
Task 1: complete (content.service.ts Conteudo type fixed, no commit, review clean)
Task 2: complete (HomeScreen/DevotionalsListScreen/DevotionalDetailScreen fixed, no commit, review clean, tsc project-wide clean)
Task 3: complete (CreateConteudoScreen edit mode + CreateConteudo route id param, no commit, review clean, tsc project-wide clean)
Task 4: complete (edit/delete UI for Conteudo in list+detail, no commit, review clean, tsc project-wide clean) — Part A (Conteudo) done
Task 5: complete (courses.service.ts Curso type fixed + updateCurso/deleteCurso added, no commit, review clean)
Task 6: complete (CoursesListScreen/CourseDetailScreen fixed, no commit, review clean, tsc project-wide clean)
Task 7: complete (EditCursoScreen + EditCurso route, no commit, review clean, tsc project-wide clean) — Minor: implementer self-report claimed a fix that wasn't actually needed/made (code itself is correct, verified byte-for-byte)
Task 8: complete (CourseDetailScreen edit/delete UI, no commit, review clean, tsc project-wide clean) — legitimate 1-line position deviation from brief (canManage moved after curso declaration to fix real TS use-before-declaration bug in the brief itself; content unchanged) — Part B (Curso) done
Task 9: complete (backend EventoOcorrencia + toOcorrencia gain criadorId/descricao, no commit, review clean)
Task 10: complete (events.service.ts criadorId + EventoDetalhe + getEvento/deleteEvento, no commit, review clean, tsc project-wide clean)
Task 11: complete (CreateEventoScreen edit mode + CreateEvento route id param, no commit, review clean, tsc project-wide clean, ISO date round-trip verified correct)
Task 12: complete (EventsScreen edit/delete UI, no commit, review clean, tsc project-wide clean) — Part C (Evento) done, all 12 implementation tasks complete
Final whole-feature review (opus): Approved, no Critical/Important findings. Minor: EventoDetalhe.criadorId is typed as present but the GET /api/eventos/:id endpoint that getEvento() calls doesn't actually return a flat criadorId (only the month-list endpoint does) — harmless today since CreateEventoScreen's edit mode never reads criadorId off the getEvento result, just a latent type inaccuracy if someone later trusts that field from a detail fetch.
Task 13: pending — requires user to manually test against running backend + device.

--- Plan 3: sala-colegas ---
Task 1: complete (backend listarColegas endpoint, no commit, review clean — reviewer flagged salaId-on-HistoricoCursoResponse as scope creep, but that's a false positive: it's pre-existing uncommitted work from earlier this session fixing the course-detail crash bug, not introduced by this task)
Task 2: complete (coursesService.getColegas + ColegaSala type, no commit, review clean)
Task 3: complete (SalaScreen + Sala route + AppStack registration, no commit, review clean, tsc clean)
Task 4: complete (CourseDetailScreen auto-navigate + Ver colegas da turma button, no commit, review clean, tsc project-wide clean) — all 4 implementation tasks complete
Final whole-feature review (opus): Approved, no Critical/Important findings. Minor: 200-participant cap on listarColegas (fine at church scale, matches plan), in-memory filter instead of DB-level filter (negligible, matches plan). Task 5 pending — requires user to manually test against running backend + device.

--- Plan 4: cursos-criar-buscar-filtro ---
Task 1: complete (coursesService.createCurso, no commit, review clean)
Task 2: complete (CreateCursoScreen + CreateCurso route, EditCursoScreen untouched, no commit, review clean, tsc clean)
Task 3: complete (CoursesListScreen filter wrap + search + Criar curso, no commit, review clean, tsc project-wide clean) — all 3 implementation tasks complete
Final whole-feature review (opus): Approved, no Critical/Important findings. Minor (informational): descricaoMaterial sent as '' when blank instead of omitted, but that's pre-existing EditCursoScreen behavior deliberately mirrored, not a new issue. Task 4 pending — requires user to manually test against running backend + device.
