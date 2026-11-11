package ru.spo.auth.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.spo.auth.domain.Role;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Integer> {

    Optional<Role> findByCode(String code);

    List<Role> findByCodeIn(Collection<String> codes);
}
