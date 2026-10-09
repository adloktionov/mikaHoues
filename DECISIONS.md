# Decisions

- 2026-10-09: User approved architecture and implementation, including milestone commits. Work in the existing clean checkout on the explicitly requested feature branch; no extra checkout is needed because old app remains in project/ and was clean (134/134 baseline tests passed).
- A single main implementer; fresh independent QA at geometry/masonry/import integration gates and final review.
- Architecture assumptions from approved plan: desktop editing/mobile viewing; half-length concerns length, not final-course height; no price calculation or structural certification.
